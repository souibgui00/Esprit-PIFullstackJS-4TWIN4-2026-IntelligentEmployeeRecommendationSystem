const mongoose = require('mongoose');

const uri = 'mongodb://sarra_mrabet:sarra@ac-skuyy89-shard-00-00.thpvndq.mongodb.net:27017,ac-skuyy89-shard-00-01.thpvndq.mongodb.net:27017,ac-skuyy89-shard-00-02.thpvndq.mongodb.net:27017/test?authSource=admin&replicaSet=atlas-cr5hej-shard-0&tls=true&retryWrites=true&w=majority';

async function main() {
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;

    // 1. Ensure "Ruby on Rails" skill exists
    let skill = await db.collection('skills').findOne({ name: { $regex: /^Ruby on Rails$/i } });
    if (!skill) {
        console.log('Skill not found, creating "Ruby on Rails"...');
        const res = await db.collection('skills').insertOne({
            name: 'Ruby on Rails',
            type: 'technique',
            etat: 'validated',
            description: 'Ruby on Rails web framework',
            category: 'IT',
            auto_eval: 0,
            hierarchie_eval: 0,
            createdAt: new Date(),
            updatedAt: new Date()
        });
        skill = await db.collection('skills').findOne({ _id: res.insertedId });
    }
    console.log('Skill ID:', skill._id);

    // 2. Find Mohamed Amine Souibgui
    const user = await db.collection('users').findOne({ email: 'mohamedamine.souibgui@esprit.tn' });
    if (!user) {
        console.error('User not found!');
        process.exit(1);
    }
    console.log('Found user:', user.name, user._id);

    // 3. Add skill to user if not already there
    const hasSkill = user.skills?.some(s => s.skillId && s.skillId.toString() === skill._id.toString());
    
    if (hasSkill) {
        console.log('User already has Ruby on Rails skill.');
    } else {
        await db.collection('users').updateOne(
            { _id: user._id },
            { 
                $push: { 
                    skills: {
                        skillId: skill._id,
                        level: 'intermediate',
                        auto_eval: 0,
                        hierarchie_eval: 0,
                        history: [{
                            date: new Date(),
                            action: 'ADDED',
                            details: 'Added programmatically'
                        }]
                    }
                }
            }
        );
        console.log('Successfully added Ruby on Rails to Mohamed Amine Souibgui.');
    }

    mongoose.disconnect();
}

main().catch(console.error);
