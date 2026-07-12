'use client'

import { useState, useEffect } from 'react'

type Post = {
  id: number
  business: string
  mediaUrl: string
  mediaType: 'image' | 'video'
  caption: string
  isSponsored: boolean
}

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [step, setStep] = useState(1) // 1=form, 2=payment, 3=done

  // Form fields
  const [business, setBusiness] = useState('')
  const [caption, setCaption] = useState('')
  const [mediaUrl, setMediaUrl] = useState('')
  const [txId, setTxId] = useState('')

  // Fetch posts from database on load
  useEffect(() => {
    fetchPosts()
  }, [])

  const fetchPosts = async () => {
    try {
      const res = await fetch('/api/posts')
      const data = await res.json()
      setPosts(data)
    } catch (error) {
      console.log('Failed to fetch posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitPost = async () => {
    // Basic validation
    if (txId.length < 8) {
      alert('Please enter a valid Transaction ID from Orange Money/MyZaka')
      return
    }
    if (!business || !caption || !mediaUrl) {
      alert('Please fill all fields')
      return
    }

    const newPost: Post = {
      id: Date.now(),
      business: business,
      mediaUrl: mediaUrl,
      mediaType: mediaUrl.includes('.mp4') ? 'video' : 'image',
      caption: caption,
      isSponsored: true
    }

    // Save to database
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPost)
      })
      
      if (!res.ok) throw new Error('Failed to save')
      
      // Update UI instantly
      setPosts([newPost, ...posts])
      setStep(3)
      
      // Reset form
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
      console.log(error)
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

      {/* Promote Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full max-h-96 overflow-y-auto">

            {step === 1 && (
              <>
                <h2 className="text-xl font-bold mb-4">Step 1: Create Your Post</h2>
                <input
                  value={business}
                  onChange={e => setBusiness(e.target.value)}
                  placeholder="Business Name"
                  className="w-full border p-2 rounded mb-3"
                />
                <input
                  value={mediaUrl}
                  onChange={e => setMediaUrl(e.target.value)}
                  placeholder="Image/Video URL - paste link here"
                  className="w-full border p-2 rounded mb-3"
                />
                <textarea
                  value={caption}
                  onChange={e => setCaption(e.target.value)}
                  placeholder="Caption - e.g. 'Special P50 today, Block 3'"
                  className="w-full border p-2 rounded mb-3"
                  rows={3}
                />
                <button
                  onClick={() => setStep(2)}
                  className="w-full bg-blue-600 text-white py-2 rounded-lg"
                >
                  Next: Pay P20
                </button>
              </>
            )}

            {step === 2 && (
              <>
                <h2 className="text-xl font-bold mb-4">Step 2: Pay P20</h2>
                <p className="text-sm text-gray-600 mb-4">
                  1. Scan QR with Orange Money or MyZaka<br/>
                  2. Pay P20 to 72 320 961<br/>
                  3. Copy the Transaction ID from SMS
                </p>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-center mb-1">Orange Money</p>
                    <img src="/orange-qr.png" alt="Orange Money QR" className="w-full border rounded" />
                  </div>
                  <div>
                    <p className="text-xs text-center mb-1">Mascom MyZaka</p>
                    <img src="/myzaka-qr.png" alt="MyZaka QR" className="w-full border rounded" />
                  </div>
                </div>

                <input
                  value={txId}
                  onChange={e => setTxId(e.target.value)}
                  placeholder="Paste Transaction ID here"
                  className="w-full border p-2 rounded mb-3"
                />
                <button
                  onClick={handleSubmitPost}
                  className="w-full bg-green-600 text-white py-2 rounded-lg mb-2"
                >
                  Submit & Post Now
                </button>
                <button
                  onClick={() => setStep(1)}
                  className="w-full bg-gray-200 py-2 rounded-lg text-sm"
                >
                  Back
                </button>
              </>
            )}

            {step === 3 && (
              <>
                <h2 className="text-xl font-bold mb-4 text-green-600">Success!</h2>
                <p>Your post is now live on PromoBW 🎉</p>
              </>
            )}

            {step !== 3 && (
              <button
                onClick={() => {setShowModal(false); setStep(1)}}
                className="w-full mt-2 text-sm text-gray-500"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      )}

      {/* Feed */}
      {loading ? (
        <p className="text-center text-gray-500">Loading posts...</p>
      ) : (
        <div className="space-y-6">
          {posts.length === 0 ? (
            <p className="text-center text-gray-500">No posts yet. Be the first!</p>
          ) : (
            posts.map(post => (
              <div key={post.id} className="border rounded-xl overflow-hidden">
                {post.mediaType === 'video' ? (
                  <video src={post.mediaUrl} controls className="w-full h-64 object-cover" />
                ) : (
                  <img src={post.mediaUrl} alt="" className="w-full h-64 object-cover" />
                )}
                <div className="p-4">
                  <div className="flex justify-between">
                    <p className="font-bold">{post.business}</p>
                    {post.isSponsored && <span className="text-xs bg-yellow-200 px-2 py-1 rounded">Sponsored</span>}
                  </div>
                  <p className="mt-2">{post.caption}</p>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </main>
  )
}