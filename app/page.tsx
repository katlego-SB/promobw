'use client'

import { useState, useEffect } from 'react'

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

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [step, setStep] = useState(1)
  const [commentText, setCommentText] = useState<{[key: number]: string}>({})
  const [showComments, setShowComments] = useState<{[key: number]: boolean}>({})
  const [likedPosts, setLikedPosts] = useState<number[]>([])

  const [business, setBusiness] = useState('')
  const [caption, setCaption] = useState('')
  const [mediaUrl, setMediaUrl] = useState('')
  const [txId, setTxId] = useState('')

  useEffect(() => {
    const savedLikes = JSON.parse(localStorage.getItem('likedPosts') || '[]')
    setLikedPosts(savedLikes)
    fetchPosts()
  }, [])

  const fetchPosts = async () => {
    try {
      const res = await fetch('/api/posts')
      const data = await res.json()
      setPosts(data)

      data.forEach((post: Post) => {
        incrementView(post.id)
      })
    } catch (error) {
      console.log('Failed to fetch posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const incrementView = async (postId: number) => {
    await fetch('/api/posts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postId, action: 'view' })
    })
  }

  const handleLike = async (postId: number) => {
    if (likedPosts.includes(postId)) return

    setPosts(posts.map(p =>
      p.id === postId? {...p, likes: p.likes + 1 } : p
    ))

    const newLikedPosts = [...likedPosts, postId]
    setLikedPosts(newLikedPosts)
    localStorage.setItem('likedPosts', JSON.stringify(newLikedPosts))

    await fetch('/api/posts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postId, action: 'like' })
    })
  }

  const handleComment = async (postId: number) => {
    const text = commentText[postId]
    if (!text?.trim()) return

    await fetch('/api/posts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postId, action: 'comment', commentText: text })
    })

    const res = await fetch('/api/posts')
    const updatedPosts = await res.json()
    setPosts(updatedPosts)
    setCommentText({...commentText, [postId]: '' })
  }

  const toggleComments = (postId: number) => {
    setShowComments({...showComments, [postId]:!showComments[postId]})
  }

  const handleSubmitPost = async () => {
    if (txId.length < 8) {
      alert('Please enter a valid Transaction ID')
      return
    }
    if (!business ||!caption ||!mediaUrl) {
      alert('Please fill all fields')
      return
    }

    const newPost = {
      id: Date.now(),
      business: business,
      mediaUrl: mediaUrl,
      mediaType: mediaUrl.includes('.mp4')? 'video' : 'image',
      caption: caption,
      isSponsored: true,
      views: 0,
      likes: 0,
      comments: []
    }

    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPost)
      })

      if (!res.ok) throw new Error('Failed to save')

      setPosts([newPost as Post,...posts])
      setStep(3)

      setTimeout(() => {
        setShowModal(false)
        setStep(1)
        setBusiness('')
        setCaption('')
        setMediaUrl('')
        setTxId('')
      }, 2000)

    } catch (error) {
      alert('Error saving post. Please try again.')
    }
  }

  return (
    <main className="max-w-2xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">PromoBW</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Promote Your Business - P20
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full max-h-96 overflow-y-auto">
            {step === 1 && (
              <>
                <h2 className="text-xl font-bold mb-4">Step 1: Create Your Post</h2>
                <input value={business} onChange={e => setBusiness(e.target.value)} placeholder="Business Name" className="w-full border p-2 rounded mb-3" />
                <input value={mediaUrl} onChange={e => setMediaUrl(e.target.value)} placeholder="Image/Video URL" className="w-full border p-2 rounded mb-3" />
                <textarea value={caption} onChange={e => setCaption(e.target.value)} placeholder="Caption" className="w-full border p-2 rounded mb-3" rows={3} />
                <button onClick={() => setStep(2)} className="w-full bg-blue-600 text-white py-2 rounded-lg">Next: Pay P20</button>
              </>
            )}
            {step === 2 && (
              <>
                <h2 className="text-xl font-bold mb-4">Step 2: Pay P20</h2>
                <p className="text-sm text-gray-600 mb-4">Pay P20 to 72 320 961 via Orange Money/MyZaka</p>
                <input value={txId} onChange={e => setTxId(e.target.value)} placeholder="Paste Transaction ID" className="w-full border p-2 rounded mb-3" />
                <button onClick={handleSubmitPost} className="w-full bg-green-600 text-white py-2 rounded-lg mb-2">Submit & Post Now</button>
                <button onClick={() => setStep(1)} className="w-full bg-gray-200 py-2 rounded-lg text-sm">Back</button>
              </>
            )}
            {step === 3 && <><h2 className="text-xl font-bold mb-4 text-green-600">Success!</h2><p>Your post is now live 🎉</p></>}
            {step!== 3 && <button onClick={() => {setShowModal(false); setStep(1)}} className="w-full mt-2 text-sm text-gray-500">Cancel</button>}
          </div>
        </div>
      )}

      {loading? (
        <p className="text-center text-gray-500">Loading posts...</p>
      ) : (
        <div className="space-y-6">
          {posts.length === 0? (
            <p className="text-center text-gray-500">No posts yet. Be the first!</p>
          ) : (
            posts.map(post => (
              <div key={post.id} className="border rounded-xl overflow-hidden">
                {post.mediaType === 'video'? (
                  <video src={post.mediaUrl} controls className="w-full h-64 object-cover" />
                ) : (
                  <img src={post.mediaUrl} alt="" className="w-full h-64 object-cover" />
                )}
                <div className="p-4">
                  <div className="flex justify-between mb-2">
                    <p className="font-bold">{post.business}</p>
                    {post.isSponsored && <span className="text-xs bg-yellow-200 px-2 py-1 rounded">Sponsored</span>}
                  </div>
                  <p className="mb-3">{post.caption}</p>

                  <div className="flex gap-4 text-sm text-gray-500 mb-3">
                    <span>{post.views} views</span>
                    <span>{post.likes} likes</span>
                    <span>{post.comments?.length || 0} comments</span>
                  </div>

                  <div className="flex gap-2 mb-3">
                    <button
                      onClick={() => handleLike(post.id)}
                      disabled={likedPosts.includes(post.id)}
                      className={`flex-1 py-2 rounded-lg text-sm ${
                        likedPosts.includes(post.id)
                        ? 'bg-red-100 text-red-600 cursor-not-allowed'
                          : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                    >
                      {likedPosts.includes(post.id)? '❤️ Liked' : '🤍 Like'}
                    </button>
                    <button
                      onClick={() => toggleComments(post.id)}
                      className="flex-1 bg-gray-100 hover:bg-gray-200 py-2 rounded-lg text-sm"
                    >
                      💬 Comment {post.comments?.length > 0 && `(${post.comments.length})`}
                    </button>
                  </div>

                  {showComments[post.id] && (
                    <div className="border-t pt-3">
                      <div className="flex gap-2 mb-3">
                        <input
                          value={commentText[post.id] || ''}
                          onChange={e => setCommentText({...commentText, [post.id]: e.target.value})}
                          placeholder="Add a comment..."
                          className="flex-1 border p-2 rounded text-sm"
                        />
                        <button
                          onClick={() => handleComment(post.id)}
                          className="bg-blue-600 text-white px-4 py-2 rounded text-sm"
                        >
                          Post
                        </button>
                      </div>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {post.comments && post.comments.length > 0? (
                          post.comments.map(comment => (
                            <div key={comment.id} className="text-sm bg-gray-50 p-2 rounded border">
                              <p className="text-gray-800">{comment.text}</p>
                              <p className="text-xs text-gray-400 mt-1">
                                {new Date(comment.createdAt).toLocaleString()}
                              </p>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-gray-400">No comments yet. Be first!</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </main>
  )
}