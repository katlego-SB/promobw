import { Redis } from '@upstash/redis'
import { NextResponse } from 'next/server'

const redis = Redis.fromEnv()

export async function GET() {
  try {
    const posts = await redis.get('posts') || []
    return NextResponse.json(posts)
  } catch (error) {
    console.log('GET error:', error)
    return NextResponse.json([], { status: 200 })
  }
}

export async function POST(request: Request) {
  try {
    const newPost = await request.json()
    const posts = (await redis.get('posts') || []) as any[]
    const updatedPosts = [newPost, ...posts]
    await redis.set('posts', updatedPosts)
    return NextResponse.json(newPost)
  } catch (error) {
    console.log('POST error:', error)
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
  }
}