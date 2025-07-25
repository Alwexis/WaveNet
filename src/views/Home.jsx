import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext'
import Loading from '../components/Loading'
import MyPosts from '../components/MyPosts';
import Posts from '../components/Posts';
import CreatePostModal from '../components/CreatePostModal';
import EditProfileModal from '../components/EditProfileModal';
import ChatInterface from '../components/Chat';

export default function Home() {
  const navigate = useNavigate()
  const { user, firebaseUser, userLikes, chats, loading, logout, refreshUser, refreshChats } = useAuth()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('posts')
  const [searchQuery, setSearchQuery] = useState('')
  const [downloadingWavebond, setDownloadingWavebond] = useState(false);
  const [notification, setNotification] = useState(null);
  const [refresh, setRefresh] = useState(false); //? Refresh posts
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [activeChat, setActiveChat] = useState(null);

  const showNotification = (message) => {
    setNotification(message)
    setTimeout(() => setNotification(null), 3000) 
  };

  const generateWavebond = async () => {
    if (downloadingWavebond) return;
    try {
      setDownloadingWavebond(true);
      const response = await fetch(`https://wavenet.up.railway.app/wavebond/`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${firebaseUser.accessToken}`
        }
      });
  
      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }

      const blob = await response.blob();
      const fileName = response.headers
        .get("Content-Disposition")
        ?.match(/filename="(.+)"/)?.[1] || `${user.username}.wavebond`;
  
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
  
      a.remove();
      window.URL.revokeObjectURL(url);
      setDownloadingWavebond(false);
    } catch (error) {
      console.error("Error al descargar el archivo:", error);
      setDownloadingWavebond(false);
    }
  }

  const handleWavebondUpload = (e) => {
    const file = e.target.files[0];
    console.log(file)
    if (!file || !file.name.endsWith(".wavebond") || file.size > 1000) return;
    insertWavebond(file);
    document.getElementById('insertWavebond').value = null;
  }

  const insertWavebond = async (wavebond) => {
    try {
      const formData = new FormData();
      formData.append("file", wavebond);

      const _rawR = await fetch(`https://wavenet.up.railway.app/wavebond/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${firebaseUser.accessToken}`
        },
        body: formData
      });
      const response = await _rawR.json();
      await refreshUser();
      console.log(response)
      if (response.status == "error") {
        showNotification(`Error: ${response.message}`)
      } else {
        showNotification(`Now you and ${response.wavebond_user.username} share a wavebond! Congrats :]`)
      }
    } catch (error) {
      console.error("Error al insertar el archivo:", error);
    }
  }

  const handleRefreshComplete = () => {
    setRefresh(false);
  };

  const handleRefreshPosts = async () => {
    if (activeTab == 'inbox') {
      setRefresh(prevState => !prevState);
      await refreshChats();
      setRefresh(prevState => !prevState);
    } else {
      setRefresh(prevState => !prevState);
    }
  }

  const handleLogout = async () => {
    await logout();
    navigate('/login')
  }

  const onPostClose = (action, error) => {
    setIsModalOpen(false);
    if (action == "success") {
      if (activeTab === 'posts') setRefresh(true);
      showNotification(`Post created! Check it out on "My Posts"! :)`);
    } else if (action == "error") {
      showNotification(`Error creating post: ${error}`);
    } else if (action == "cancel") {
      showNotification(`Post creation canceled!`);
    }
  };

  const onEditProfileClose = (action, error) => {
    setIsEditProfileModalOpen(false);
    if (action == "success") {
      showNotification(`Profile updated!`);
    } else if (action == "error") {
      showNotification(`Error updating profile: ${error}`);
    } else if (action == "cancel") {
      showNotification(`Profile update canceled!`);
    }
  };

  const handleChatClick = (chat) => {
    setActiveChat(chat)
  }

  if (loading) return <Loading />

  return (
    <div className="min-h-screen bg-gray-100 font-mono text-black">
      <header className="bg-blue-500 text-white p-4 text-center">
        <h1 className="text-4xl font-bold animate-pulse">WeaveBond</h1>
      </header>

      <div className="container mx-auto p-4 flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <aside className="md:w-1/3 space-y-4">
          <div className="bg-white p-4 border-2 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
            <div className="flex flex-col items-center space-y-4">
              <div className="relative h-24 w-24 border-2 border-black">
                <img
                  src={user.profile_picture}
                  alt="Profile picture"
                  className="object-cover"
                />
              </div>
              <div className="text-center w-48">
                <h2 className="font-bold text-xl">{user.username}</h2>
                <div className="mt-2 space-y-1 flex flex-col items-start">
                  <p className='font-bold w-full flex justify-between'>- Friends <span>{user.friends.length}</span></p>
                  <p className='font-bold w-full flex justify-between'>- Likes <span>{userLikes}</span></p>
                  <p className='font-bold w-full flex justify-between'>- Posts <span>{user.friends.length}</span></p>
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-2">
              <button onClick={generateWavebond} disabled={downloadingWavebond}
                className="cursor-pointer w-full disabled:bg-red-400 bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 border-b-2 border-red-700 hover:border-red-800 active:border-t-2 active:border-b-0 transition-all duration-100"
              >
                { downloadingWavebond ? "Downloading WaveBond..." : "Generate WaveBond" }
              </button>
              <button onClick={() => document.getElementById('insertWavebond').click()}
                className="cursor-pointer w-full bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 border-b-2 border-red-700 hover:border-red-800 active:border-t-2 active:border-b-0 transition-all duration-100"
              >
                Link Friend
              </button>
              <input onChange={handleWavebondUpload} type="file" id="insertWavebond" className='hidden' />
              <button onClick={() => setIsEditProfileModalOpen(true)}
                className="cursor-pointer w-full bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 border-b-2 border-red-700 hover:border-red-800 active:border-t-2 active:border-b-0 transition-all duration-100"
              >
                Edit Profile
              </button>
              <button onClick={handleLogout}
                className="cursor-pointer w-full bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 border-b-2 border-red-700 hover:border-red-800 active:border-t-2 active:border-b-0 transition-all duration-100"
              >
                Logout
              </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="md:w-2/3">
          <div className="bg-white border-2 border-black p-4 shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
            <div className="flex space-x-4 mb-4">
              <button
                onClick={() => setActiveTab('posts')}
                className={`flex-1 font-bold py-2 px-4 border-b-2 transition-all duration-100 cursor-pointer ${
                  activeTab === 'posts' ? 'bg-blue-500 text-white border-blue-700' : 'bg-gray-200 border-gray-400'
                }`}
              >
                Posts
              </button>
              <button
                onClick={() => setActiveTab('inbox')}
                className={`flex-1 font-bold py-2 px-4 border-b-2 transition-all duration-100 cursor-pointer ${
                  activeTab === 'inbox' ? 'bg-green-500 text-white border-green-700' : 'bg-gray-200 border-gray-400'
                }`}
              >
                Inbox
              </button>
              <button
                onClick={() => setActiveTab('my-posts')}
                className={`flex-1 font-bold py-2 px-4 border-b-2 transition-all duration-100 cursor-pointer ${
                  activeTab === 'my-posts' ? 'bg-yellow-500 text-white border-yellow-700' : 'bg-gray-200 border-gray-400'
                }`}
              >
                My Posts
              </button>
            </div>

            {/* Search bar */}
            {
              !activeChat && (
                <div className="mb-4 flex space-x-2">
                  <input
                    type="text"
                    placeholder="Search users and posts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-black bg-gray-100"
                  />
                  <button
                    onClick={handleRefreshPosts}
                    className={`cursor-pointer disabled:cursor-not-allowed px-4 py-2 bg-blue-500 text-white font-bold border-2 border-black ${refresh ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-600'}`}
                    disabled={refresh}
                  >
                    {refresh ? 'Refreshing...' : 'Refresh'}
                  </button>
                </div>
              )
            }

            {activeTab === 'posts' && (
              <Posts refresh={refresh} onRefreshComplete={handleRefreshComplete} />
            )}

            {activeTab === 'inbox' && (
                activeChat ? (
                  <ChatInterface chat={activeChat} onBack={() => setActiveChat(null)} />
                ) : (  
                  <div className="space-y-4">
                    {chats.map((chat) => {
                      const friend = chat.users.find((u) => u.uid !== user.uid);
                      return (
                        <div onClick={() => handleChatClick(chat)} key={chat.id} className="flex items-start bg-gray-100 p-4 border-2 border-black cursor-pointer hover:bg-gray-200">
                          <img className='w-12 h-12 object-contain border-2 border-black' src={friend.profile_picture} alt="" />
                          <div className='ml-2'>
                            <h3 className="font-bold">{friend.username}</h3>
                            <p className="text-sm">
                              {
                                chat.last_message ? chat.last_message.content : 'No messages'
                              }
                            </p>
                          </div>
                        </div>
                      )
                      }
                    )}
                </div>
                )
            )}

            {activeTab === 'my-posts' && (
              <MyPosts refresh={refresh} onRefreshComplete={handleRefreshComplete} onNotification={showNotification} />
            )}
          </div>
          {
            activeTab != 'inbox' && (
              <button
              onClick={() => setIsModalOpen(true)}
              className="cursor-pointer fixed bottom-8 right-8 bg-pink-500 hover:bg-pink-600 text-white font-bold px-2 py-2 md:py-4 md:px-6 rounded-full border-2 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:shadow-[2px_2px_0_0_rgba(0,0,0,1)] active:shadow-none transition-all duration-100 animate-bounce"
            >
              <span className='hidden md:block'>
                Create Post
              </span>
              <svg className='md:hidden' xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M11 11V5h2v6h6v2h-6v6h-2v-6H5v-2z"/></svg>
            </button>
            )
          }
        </main>
      </div>
      <CreatePostModal isOpen={isModalOpen} onClose={onPostClose} />
      <EditProfileModal
        isOpen={isEditProfileModalOpen}
        onClose={onEditProfileClose}
      />
      {notification && (
        <div className="fixed top-4 right-4 bg-yellow-300 border-2 border-black p-4 shadow-[4px_4px_0_0_rgba(0,0,0,1)] max-w-sm">
          <p className="font-bold">{notification}</p>
        </div>
      )}
    </div>
  )
}

