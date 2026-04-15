'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { collection, query, orderBy, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';

interface Topic {
  id: string;
  title: string;
  author: string;
  category: string;
  replies: number;
  views: number;
  lastReply: string;
  isPremium: boolean;
  preview: string;
}

export default function ForumPage() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');

  useEffect(() => {
    loadTopics();
  }, []);

  const loadTopics = async () => {
    try {
      const q = query(collection(db, 'forum_topics'), orderBy('lastReply', 'desc'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Topic[];
      setTopics(data);
    } catch (error) {
      console.error('Error loading forum:', error);
    } finally {
      setLoading(false);
    }
  };

  const categories = ['all', 'Success Stories', 'Q&A', 'Herb Combinations', 'Mental Health', 'Chronic Conditions'];

  const filteredTopics = activeCategory === 'all' 
    ? topics 
    : topics.filter(t => t.category === activeCategory);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F5F0] flex items-center justify-center">
        <div className="text-[#97A97C] text-xl">Loading community...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F0]">
      <div className="bg-[#2C3E2D] text-white py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-4">Community Forum</h1>
          <p className="text-xl text-gray-300">
            Connect with others on their healing journey. Share experiences, ask questions, and learn from the community.
          </p>
          <div className="mt-4 inline-block bg-[#97A97C] text-white px-4 py-2 rounded-full text-sm">
            💎 Premium Access - Subscribers Only
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-1/4">
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <button className="w-full bg-[#97A97C] text-white py-3 rounded font-bold hover:bg-[#7A8A63] mb-4">
                + Start New Topic
              </button>
              <div className="text-sm text-gray-600">
                <p className="mb-2">Share your story or ask a question</p>
                <p className="text-xs">Community guidelines apply</p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-bold text-[#2C3E2D] mb-4">Categories</h3>
              <ul className="space-y-2">
                {categories.map(cat => (
                  <li 
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`cursor-pointer capitalize ${activeCategory === cat ? 'text-[#97A97C] font-bold' : 'text-gray-600 hover:text-[#97A97C]'}`}
                  >
                    {cat}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Topics List */}
          <div className="lg:w-3/4">
            <div className="space-y-4">
              {filteredTopics.map((topic) => (
                <div key={topic.id} className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      {topic.isPremium && (
                        <span className="bg-[#97A97C] text-white text-xs px-2 py-1 rounded">Premium</span>
                      )}
                      <span className="text-xs text-gray-500">{topic.category}</span>
                    </div>
                    <span className="text-xs text-gray-500">{topic.lastReply}</span>
                  </div>
                  
                  <h3 className="text-xl font-bold text-[#2C3E2D] mb-2 hover:text-[#97A97C] cursor-pointer">
                    {topic.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{topic.preview}</p>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>By {topic.author}</span>
                    <div className="flex gap-4">
                      <span>💬 {topic.replies} replies</span>
                      <span>👁 {topic.views} views</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredTopics.length === 0 && (
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <p className="text-gray-600">No topics in this category yet. Be the first to share!</p>
              </div>
            )}
          </div>
        </div>

        {/* Community Guidelines */}
        <div className="mt-12 bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-lg">
          <h3 className="font-bold text-blue-800 mb-2">Community Guidelines</h3>
          <ul className="text-blue-700 text-sm space-y-1">
            <li>• Share personal experiences, not medical advice</li>
            <li>• Always consult practitioners for specific treatment recommendations</li>
            <li>• Be respectful and supportive of others' healing journeys</li>
            <li>• No commercial promotion without approval</li>
          </ul>
        </div>
      </div>
    </div>
  );
}