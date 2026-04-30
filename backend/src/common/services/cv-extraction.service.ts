import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as mammoth from 'mammoth';
import nlp from 'compromise';
import { SkillsService } from '../../skills/skills.service';

// PDF parsing handled dynamically in extractTextBuffer method

@Injectable()
export class CvExtractionService {
  private readonly logger = new Logger(CvExtractionService.name);

  constructor(private readonly skillsService: SkillsService) {}

  async extractTextBuffer(buffer: Buffer, mimetype: string): Promise<string> {
    try {
      if (mimetype.includes('pdf')) {
        this.logger.log('Processing PDF file...');

        // Try pdfreader approach (simpler and more reliable)
        try {
          const { PdfReader } = require('pdfreader');

          return new Promise((resolve, reject) => {
            const pdfReader = new PdfReader();
            const text: string[] = [];
            let lastY = -1;
            pdfReader.parseBuffer(buffer, (err: any, item: any) => {
              if (err) {
                reject(err);
                return;
              }

              if (!item) {
                const fullText = text.join('');
                this.logger.log(
                  `Successfully extracted ${fullText.length} characters from PDF using pdfreader`,
                );
                resolve(fullText);
                return;
              }

              if (item.text) {
                // If Y coordinate changes, it's likely a new line
                if (lastY !== -1 && Math.abs(item.y - lastY) > 0.05) {
                  text.push('\n');
                }
                text.push(item.text);
                lastY = item.y;
              }
            });
          });
        } catch (pdfjsError: any) {
          this.logger.error('pdfreader failed:', pdfjsError.message);

          // Fallback to pdf-parse approach
          try {
            let pdfParseModule: any;
            try {
              pdfParseModule = require('pdf-parse/lib/pdf-parse');
            } catch {
              pdfParseModule = require('pdf-parse');
            }

            const pdfParse = pdfParseModule.default || pdfParseModule;

            return new Promise((resolve, reject) => {
              pdfParse(buffer)
                .then((data: any) => {
                  const extractedText = data.text || '';
                  this.logger.log(
                    `Successfully extracted ${extractedText.length} characters from PDF using pdf-parse`,
                  );
                  resolve(extractedText);
                })
                .catch((error: any) => {
                  this.logger.error(
                    'pdf-parse fallback failed:',
                    error.message,
                  );
                  reject(error);
                });
            });
          } catch (fallbackError: any) {
            this.logger.error(
              'pdf-parse fallback failed:',
              fallbackError.message,
            );
            throw new Error('All PDF parsing methods failed');
          }
        }
      } else if (
        mimetype.includes('word') ||
        mimetype.includes('docx') ||
        mimetype.includes('document')
      ) {
        try {
          const result = await mammoth.extractRawText({ buffer });
          const text = result.value || '';
          this.logger.log(
            `Successfully extracted ${text.length} characters from Word document`,
          );
          return text;
        } catch (mammothError: any) {
          this.logger.error('Mammoth extraction failed:', mammothError.message);
          throw new Error(
            `Word document extraction failed: ${mammothError.message}`,
          );
        }
      } else {
        throw new Error(
          `Unsupported file type: ${mimetype}. Only PDFs and Word docs are supported.`,
        );
      }
    } catch (error: any) {
      this.logger.error(`Error extracting text from buffer: ${error.message}`);
      throw error;
    }
  }

  async extractProfileFromBuffer(
    buffer: Buffer,
    mimetype: string,
  ): Promise<any> {
    try {
      this.logger.log(
        `Starting section-aware CV extraction for file type: ${mimetype}`,
      );
      const rawText = await this.extractTextBuffer(buffer, mimetype);
      if (!rawText || rawText.trim().length === 0) {
        this.logger.warn('No text extracted from CV file');
        return null;
      }

      // Cleanup text (unified spaces)
      const text = rawText.replace(/\s+/g, ' ');
      const sections = this.splitIntoSections(rawText); // use rawText for line-break preservation in splitting

      // Metadata extraction
      const headerText = sections.header || text.slice(0, 500);
      const emailMatch = headerText.match(
        /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/,
      );
      const email = emailMatch
        ? emailMatch[0]
        : text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)?.[0] ||
          null;

      const phoneMatch = text.match(
        /(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{1,4}\)?[\s.-]?)?\d{2,4}[\s.-]?\d{2,4}[\s.-]?\d{2,6}/,
      );
      const telephone = phoneMatch ? phoneMatch[0] : null;

      // Improved Name Detection from Header
      const headerLines = (sections.header || '')
        .split('\n')
        .map((l) => l.trim())
        .filter(
          (l) =>
            l.length > 0 &&
            l.length < 50 &&
            !/^(cv|curriculum|vitae|profile|about|adresse|email|phone|tél|portable|tel|contact)/i.test(
              l,
            ),
        );

      const docHeader = nlp(headerLines.join(' '));
      const people = docHeader.people().out('array') as string[];
      const name = people.length > 0 ? people[0] : headerLines[0] || null;

      // Section-specific Skill Extraction
      // We prioritize Skills and Experience sections, and IGNORE Interests/Header noise
      const coreSkillsText = [
        sections.skills,
        sections.experience,
        sections.summary,
      ]
        .filter(Boolean)
        .join('\n');
      // If we found specific sections, we use them. If not, we fallback to the whole text but avoid 'hobbies' and 'languages'
      const skillExtractionText =
        coreSkillsText.length > 50
          ? coreSkillsText
          : rawText.replace(
              /(langues|languages|loisirs|hobbies|interests|intérêts)[\s\S]*/i,
              '',
            );

      const { matchedSkillIds, suggestions } = await this.findSkillsInText(
        skillExtractionText,
        { createMissing: false },
      );

      // Years of experience extraction (improved logic)
      let yearsOfExperience = 0;
      const experienceMatch = text.match(
        /(\d+)\s*(?:\+)?\s*(?:years?\s*(?:of\s*)?experience|ans?\s*d.{0,5}expérience)/i,
      );
      if (experienceMatch) {
        yearsOfExperience = parseInt(experienceMatch[1], 10);
      } else if (sections.experience) {
        // Fallback: estimate from career span if section exists
        // (Simple estimate for first version)
        const dateMatches = sections.experience.match(/\b(19|20)\d{2}\b/g);
        if (dateMatches && dateMatches.length >= 2) {
          const years = dateMatches.map(Number);
          yearsOfExperience = Math.max(...years) - Math.min(...years) || 1;
        }
      }

      const result = {
        name,
        email,
        telephone,
        yearsOfExperience,
        skillIds: matchedSkillIds,
        skillSuggestions: suggestions,
        sectionsFound: Object.keys(sections).filter(
          (k) => sections[k]?.length > 0,
        ),
      };

      this.logger.log(
        `Extraction complete. Sections: ${result.sectionsFound.join(', ')}. Found ${matchedSkillIds.length} skills.`,
      );
      return result;
    } catch (error: any) {
      this.logger.error(`CV extraction failed: ${error.message}`);
      throw error;
    }
  }

  private splitIntoSections(text: string): Record<string, string> {
    const lines = text.split('\n');
    const sections: Record<string, string> = { header: '' };
    let currentSection = 'header';

    const sectionDetectors: Record<string, RegExp> = {
      experience:
        /^(?:experience|work history|parcours|emplois|historique professionnel|professional experience)/i,
      skills:
        /^(?:skills|competencies|compétences|outils|technologies|hard skills|technical knowledge)/i,
      education:
        /^(?:education|formations|diplômes|academic background|studies|études)/i,
      summary:
        /^(?:summary|profile|about me|à propos|objectif|résumé|introduction)/i,
      languages: /^(?:languages|langues)/i,
    };

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine.length === 0) continue;

      let found = false;
      for (const [section, regex] of Object.entries(sectionDetectors)) {
        if (regex.test(trimmedLine) && trimmedLine.length < 40) {
          currentSection = section;
          sections[currentSection] = sections[currentSection] || '';
          found = true;
          break;
        }
      }

      if (!found) {
        sections[currentSection] += line + '\n';
      }
    }

    return sections;
  }

  async extractDataFromCV(filePath: string): Promise<string[]> {
    try {
      this.logger.log(`Extracting skills from file path: ${filePath}`);
      const dataBuffer = fs.readFileSync(filePath);
      const ext = path.extname(filePath).toLowerCase();
      const mimetype =
        ext === '.pdf'
          ? 'application/pdf'
          : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

      const text = await this.extractTextBuffer(dataBuffer, mimetype);

      // 1) Call Python NLP Service with real MongoDB skill vocabulary
      let nlpSkills: string[] = [];
      try {
        // Fetch real skill names from MongoDB to use as dynamic vocabulary
        const availableSkills = await this.skillsService.findAll();
        const knownSkills = availableSkills
          .map((s: any) => s.name)
          .filter(Boolean);

        const response = await fetch('http://localhost:8000/extract-skills', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            description: text,
            title: 'CV Extraction',
            knownSkills: knownSkills.length > 0 ? knownSkills : undefined,
          }),
        });
        if (response.ok) {
          const data = await response.json();
          nlpSkills = data.extractedSkills || [];
          this.logger.log(
            `Python NLP extraction matched: ${nlpSkills.join(', ')} (vocabulary: ${knownSkills.length} skills)`,
          );
        } else {
          this.logger.warn(`Python NLP returned status: ${response.status}`);
        }
      } catch (err: any) {
        this.logger.error(
          `Failed to reach Python NLP at localhost:8000: ${err.message}`,
        );
      }

      // 2) Fuse with the internal matching to guarantee MongoDB skill linking
      const combinedText = text + '\n\n' + nlpSkills.join(' ');
      const { matchedSkillIds } = await this.findSkillsInText(combinedText, {
        createMissing: true,
      });

      return matchedSkillIds;
    } catch (error: any) {
      this.logger.error(
        `Failed to extract data via local NLP: ${error.message}`,
      );
      return [];
    }
  }

  private extractSkillsSection(text: string): string {
    const skillsSectionRegex =
      /(?:skills|compétences|technical\s+skills|technologies|hard\s+skills)[\s:]*\n([\s\S]*?)(?:\n\s*(?:experience|education|projects|certif|formation|langues|hobbies|interests|\d{4})|$)/i;
    const match = text.match(skillsSectionRegex);
    if (match && match[1] && match[1].length > 30) {
      this.logger.log('Targeting skills section for extraction');
      return match[1];
    }
    return text;
  }

  private async findSkillsInText(
    text: string,
    options: { createMissing?: boolean } = {},
  ): Promise<{ matchedSkillIds: string[]; suggestions: string[] }> {
    if (!text || text.trim().length === 0) {
      return { matchedSkillIds: [], suggestions: [] };
    }

    try {
      const availableSkills = await this.skillsService.findAll();
      const targetText = this.extractSkillsSection(text);
      const rawTextLower = targetText.toLowerCase();
      const doc = nlp(rawTextLower);
      const cvTerms = doc.terms().out('array') as string[];

      const matchedSkillIds: Set<string> = new Set();
      const suggestions: Set<string> = new Set();
      const normalizedCvText = this.normalizeForMatching(rawTextLower);

      // Pass 1: Match against existing DB skills (Exact & Fuzzy)
      for (const skill of availableSkills) {
        const skillNameLower = skill.name.toLowerCase();
        const normalizedSkillName = this.normalizeForMatching(skillNameLower);

        // Exact Regex Match (Standard)
        const escaped = this.escapeRegExp(skillNameLower);
        const regex = new RegExp(`(?:^|\\W)${escaped}(?:$|\\W)`, 'i');

        if (
          regex.test(rawTextLower) ||
          normalizedCvText.includes(normalizedSkillName)
        ) {
          matchedSkillIds.add(skill._id.toString());
          continue;
        }

        // Fuzzy match for short/misspelled versions (only for 5+ chars for safety)
        if (skillNameLower.length >= 5) {
          for (const term of cvTerms) {
            const t = term.toLowerCase();
            if (
              t.length >= 4 &&
              this.calculateLevenshtein(t, skillNameLower) <= 1
            ) {
              matchedSkillIds.add(skill._id.toString());
              break;
            }
          }
        }
      }

      // Pass 2: Dictionary-based discovery
      const SKILL_DICTIONARIES = {
        knowHow: [
          'Java',
          'C++',
          'C#',
          'Python',
          'JavaScript',
          'TypeScript',
          'HTML',
          'CSS',
          'PHP',
          'Ruby',
          'Swift',
          'Kotlin',
          'Go',
          'Rust',
          'React',
          'Angular',
          'Vue',
          'Svelte',
          'Next.js',
          'NestJS',
          'Express',
          'Django',
          'Flask',
          'Spring Boot',
          'Laravel',
          'Symfony',
          'ASP.NET',
          'MySQL',
          'PostgreSQL',
          'MongoDB',
          'Oracle',
          'SQL Server',
          'Redis',
          'Cassandra',
          'Elasticsearch',
          'Git',
          'Docker',
          'Kubernetes',
          'Firebase',
          'AWS',
          'Azure',
          'GCP',
          'Jenkins',
          'Terraform',
          'Ansible',
          'Linux',
          'Unix',
          'Bash',
          'PowerShell',
          'Jira',
          'Confluence',
          'Trello',
          'Selenium',
          'Cypress',
          'Jest',
          'Mocha',
          'Excel',
          'QuickBooks',
          'SAP',
          'Oracle Financials',
          'Xero',
          'Tableau',
          'Power BI',
          'SPSS',
          'Bloomberg Terminal',
          'Google Analytics',
          'HubSpot',
          'Salesforce',
          'Mailchimp',
          'Hootsuite',
          'WordPress',
          'Figma',
          'Canva',
          'Workday',
          'BambooHR',
          'ADP',
          'Greenhouse',
          'Lever',
          'LinkedIn Recruiter',
        ],
        knowledge: [
          'Agile',
          'Scrum',
          'Kanban',
          'OOP',
          'Algorithms',
          'Data Structures',
          'System Design',
          'Machine Learning',
          'Data Science',
          'AI',
          'NLP',
          'Computer Vision',
          'REST API',
          'GraphQL',
          'Microservices',
          'CI/CD',
          'TDD',
          'BDD',
          'Talent Acquisition',
          'Employee Relations',
          'Performance Management',
          'Compensation',
          'Benefits Administration',
          'Onboarding',
          'Labor Law',
          'Diversity',
          'Inclusion',
          'Organizational Development',
          'SEO',
          'SEM',
          'Content Marketing',
          'Digital Marketing',
          'Social Media Marketing',
          'B2B Sales',
          'B2C Sales',
          'Market Research',
          'Brand Management',
          'Copywriting',
          'Public Relations',
          'Lead Generation',
          'Accounting',
          'Financial Analysis',
          'Budgeting',
          'Forecasting',
          'Auditing',
          'Taxation',
          'IFRS',
          'GAAP',
          'Risk Management',
          'Corporate Finance',
          'Payroll',
          'Underwriting',
          'Claims Management',
          'Actuarial Science',
          'Regulatory Compliance',
          'Policy Administration',
          'Quality Assurance',
        ],
        softSkill: [
          'Leadership',
          'Communication',
          'Teamwork',
          'Problem Solving',
          'Critical Thinking',
          'Time Management',
          'Adaptability',
          'Creativity',
          'Emotional Intelligence',
          'Negotiation',
          'Conflict Resolution',
          'Project Management',
          'Customer Service',
          'Presentation Skills',
          'Active Listening',
          'Decision Making',
          'Work Ethic',
        ],
      };

      for (const [skillType, techList] of Object.entries(SKILL_DICTIONARIES)) {
        for (const tech of techList) {
          const techLower = tech.toLowerCase();
          const existsInDb = availableSkills.some(
            (s) => s.name.toLowerCase() === techLower,
          );

          if (!existsInDb) {
            const escaped = this.escapeRegExp(techLower);
            const regex = new RegExp(`(?<=^|\\W)${escaped}(?=$|\\W)`, 'i');

            if (regex.test(rawTextLower) || cvTerms.includes(techLower)) {
              if (options.createMissing) {
                try {
                  this.logger.log(`Auto-creating missing skill: ${tech}`);
                  const newSkill = await this.skillsService.create({
                    name: tech,
                    category: 'Auto-Discovered',
                    type: skillType,
                  });
                  matchedSkillIds.add(newSkill._id.toString());
                  availableSkills.push(newSkill);
                } catch (err: any) {
                  this.logger.error(
                    `Failed to auto-create ${tech}: ${err.message}`,
                  );
                }
              } else {
                suggestions.add(tech);
              }
            }
          }
        }
      }

      return {
        matchedSkillIds: Array.from(matchedSkillIds),
        suggestions: Array.from(suggestions),
      };
    } catch (error: any) {
      this.logger.error(
        `Failed to extract skills via local NLP: ${error.message}`,
      );
      return { matchedSkillIds: [], suggestions: [] };
    }
  }

  private normalizeForMatching(text: string): string {
    return text
      .toLowerCase()
      .replace(/[.\-\s]/g, '') // remove dots, hyphens, spaces: React.js -> reactjs
      .replace(/[^a-z0-9]/g, ''); // alphanumeric only
  }

  private calculateLevenshtein(a: string, b: string): number {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;
    const matrix = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1, // insertion
            matrix[i - 1][j] + 1, // deletion
          );
        }
      }
    }
    return matrix[b.length][a.length];
  }

  private escapeRegExp(string: string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
