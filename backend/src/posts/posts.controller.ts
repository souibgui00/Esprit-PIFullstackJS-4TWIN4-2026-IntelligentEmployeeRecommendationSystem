import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    UseGuards,
    Request,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('posts')
@UseGuards(JwtAuthGuard)
export class PostsController {
    constructor(private readonly postsService: PostsService) { }

    @Post()
    async create(@Request() req: any, @Body() body: CreatePostDto) {
        // Fill in author info from request user if not provided
        const postData = {
            ...body,
            authorId: req.user.userId,
            authorName: body.authorName || req.user.name,
            authorAvatar: body.authorAvatar || req.user.avatar,
        };
        return this.postsService.create(postData as any);
    }

    @Get()
    async findAll() {
        return this.postsService.findAll();
    }

    @Post(':id/like')
    async like(@Request() req: any, @Param('id') id: string) {
        const userId = req.user.userId;
        return this.postsService.like(id, userId);
    }

    @Post(':id/comment')
    async comment(@Request() req: any, @Param('id') id: string, @Body() body: { content: string }) {
        const commentData = {
            authorId: req.user.userId,
            authorName: req.user.name,
            authorAvatar: req.user.avatar,
            content: body.content,
        };
        return this.postsService.comment(id, commentData);
    }

    @Delete(':id')
    async remove(@Param('id') id: string) {
        return this.postsService.remove(id);
    }
}
