import { NextRequest, NextResponse } from 'next/server'
import { Redis } from '@upstash/redis'

const redis = Redis.fromEnv()

type Comment = {
  id: number
  text: string
  createdAt: string
}

type Post = {
  id: number
  business: string
  mediaUrl: string
  mediaType: 'image' | 'video'
  caption: string
  isSponsored: boolean
  views: number
  likes: number
  comments: Comment[]
}

// GET all posts
export async function GET() {
  const posts = await redis.get<Post[]>('posts') || []
  return NextResponse.json(posts)
}

// POST new post
export async function POST(req: NextRequest) {
  const newPost: Post = await req.json()
  const posts = await redis.get<Post[]>('posts') || []
  
  const postWithStats: Post = {
  ...newPost,
    views: 0,
    likes: 0,
    comments: []
  }
  
  const updatedPosts = [postWithStats,...posts]
  await redis.set('posts', updatedPosts)
  return NextResponse.json(postWithStats)
}

// PATCH for likes/views/comments
export async function PATCH(req: NextRequest) {
  const { postId, action, commentText } = await req.json()
  const posts = await redis.get<Post[]>('posts') || []
  
  const updatedPosts = posts.map(post => {
    if (post.id === postId) {
      if (action === 'view') return {...post, views: post.views + 1 }
      if (action === 'like') return {...post, likes: post.likes + 1 }
      if (action === 'comment') {
        const newComment: Comment = {
          id: Date.now(),
          text: commentText,
          createdAt: new Date().toISOString()
        }
        return {...post, comments: [...post.comments, newComment] }
      }
    }
    return post
  })
  
  await redis.set('posts', updatedPosts)
  return NextResponse.json(updatedPosts.find(p => p.id === postId))
}