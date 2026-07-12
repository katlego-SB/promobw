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

// GET all posts - FIXED FOR OLD POSTS
export async function GET() {
  const posts = await redis.get<any[]>('posts') || []
  
  const safePosts = posts.map(post => ({
  ...post,
    views: post.views ?? 0,
    likes: post.likes ?? 0,
    comments: post.comments ?? []
  }))
  
  return NextResponse.json(safePosts)
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
  const posts = await redis.get<any[]>('posts') || []
  
  const updatedPosts = posts.map(post => {
    // Ensure old posts have fields before updating
    const safePost = {
    ...post,
      views: post.views ?? 0,
      likes: post.likes ?? 0,
      comments: post.comments ?? []
    }
    
    if (safePost.id === postId) {
      if (action === 'view') return {...safePost, views: safePost.views + 1 }
      if (action === 'like') return {...safePost, likes: safePost.likes + 1 }
      if (action === 'comment') {
        const newComment: Comment = {
          id: Date.now(),
          text: commentText,
          createdAt: new Date().toISOString()
        }
        return {...safePost, comments: [...safePost.comments, newComment] }
      }
    }
    return safePost
  })
  
  await redis.set('posts', updatedPosts)
  return NextResponse.json(updatedPosts.find(p => p.id === postId))
}