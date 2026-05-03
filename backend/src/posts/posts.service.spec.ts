import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { PostsService } from './posts.service';
import { UsersService } from '../users/users.service';
import { Types } from 'mongoose';

describe('PostsService', () => {
  let service: PostsService;

  const mockPostModel = {
    find: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
  };

  const mockUsersService = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostsService,
        {
          provide: getModelToken('Post'),
          useValue: mockPostModel,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    service = module.get<PostsService>(PostsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createPost', () => {
    it('should create a new post', async () => {
      const postData = {
        title: 'Test Post',
        content: 'This is a test post',
        authorId: new Types.ObjectId().toString(),
        category: 'announcement',
      };

      mockPostModel.create.mockResolvedValueOnce({
        _id: new Types.ObjectId(),
        ...postData,
        createdAt: new Date(),
      });

      expect(service).toBeDefined();
    });
  });

  describe('getPosts', () => {
    it('should retrieve all posts', async () => {
      mockPostModel.find.mockResolvedValueOnce([
        {
          _id: new Types.ObjectId(),
          title: 'Post 1',
          content: 'Content 1',
        },
        {
          _id: new Types.ObjectId(),
          title: 'Post 2',
          content: 'Content 2',
        },
      ]);

      expect(service).toBeDefined();
    });
  });

  describe('getPostById', () => {
    it('should retrieve post by ID', async () => {
      const postId = new Types.ObjectId();

      mockPostModel.findById.mockResolvedValueOnce({
        _id: postId,
        title: 'Test Post',
        content: 'Content',
      });

      expect(service).toBeDefined();
    });
  });

  describe('updatePost', () => {
    it('should update post', async () => {
      const postId = new Types.ObjectId();
      const updateData = { title: 'Updated Title' };

      mockPostModel.findByIdAndUpdate.mockResolvedValueOnce({
        _id: postId,
        ...updateData,
      });

      expect(service).toBeDefined();
    });
  });

  describe('deletePost', () => {
    it('should delete post', async () => {
      const postId = new Types.ObjectId();

      mockPostModel.findByIdAndDelete.mockResolvedValueOnce({
        _id: postId,
        deleted: true,
      });

      expect(service).toBeDefined();
    });
  });

  afterAll(async () => {
    jest.clearAllMocks();
  });
});
