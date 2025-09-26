import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createApiUrl } from '../lib/urlUtils';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import Avatar from '../components/Avatar';
import { UserPlus, UserCheck, ArrowLeft } from 'lucide-react';

const FollowList = () => {
  const { userId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user: currentUser, token, isAuthenticated } = useAuth();
  
  const [list, setList] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [type, setType] = useState('followers');
  const [followingStatus, setFollowingStatus] = useState({});

  useEffect(() => {
    const pathType = location.pathname.includes('followers') ? 'followers' : 'following';
    setType(pathType);

    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch(createApiUrl(`users/id/${userId}`));
        if (!res.ok) throw new Error('User not found');
        const data = await res.json();
        setUser(data);
        setList(pathType === 'followers' ? data.followers : data.following);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [userId, location.pathname, currentUser]);

  useEffect(() => {
    if (currentUser && list.length > 0) {
        const initialStatus = {};
        list.forEach(person => {
            initialStatus[person._id] = currentUser.following.some(f_id => f_id === person._id);
        });
        setFollowingStatus(initialStatus);
    }
  }, [currentUser, list]);

  const handleFollowToggle = async (targetUserId) => {
    if (!isAuthenticated) {
        navigate('/login');
        return;
    }

    const isFollowing = followingStatus[targetUserId];
    const endpoint = isFollowing ? 'unfollow' : 'follow';

    setFollowingStatus(prev => ({ ...prev, [targetUserId]: !isFollowing })); // Optimistic update

    try {
        const response = await fetch(createApiUrl(`users/${endpoint}/${targetUserId}`), {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            setFollowingStatus(prev => ({ ...prev, [targetUserId]: isFollowing }));
            const data = await response.json();
            console.error('Follow/unfollow error:', data.error);
        }
    } catch (error) {
        setFollowingStatus(prev => ({ ...prev, [targetUserId]: isFollowing }));
        console.error('Failed to toggle follow status', error);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center">Error: {error}</div>;

  return (
    <div className="container mx-auto px-4 max-w-2xl py-8 pt-24">
      <Link to={`/author/${userId}`} className="flex items-center text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to profile
      </Link>
      <h1 className="text-2xl font-bold mb-4 capitalize">{user?.fullName}'s {type}</h1>
      <Card>
        <CardContent className="p-0">
          {list.length > 0 ? (
            <ul className="divide-y divide-border">
              {list.map(person => (
                <li key={person._id} className="p-4 flex items-center justify-between hover:bg-muted/50">
                  <Link to={`/author/${person._id}`} className="flex items-center gap-4">
                    <Avatar 
                      src={person.avatar?.url}
                      alt={person.fullName || 'User'}
                      size={40}
                      fallbackText={person.fullName || person.username}
                      className="border border-gray-200"
                    />
                    <div>
                      <p className="font-semibold hover:underline">{person.fullName}</p>
                      <p className="text-sm text-muted-foreground">@{person.username}</p>
                    </div>
                  </Link>
                  {currentUser && currentUser._id !== person._id && (
                    <Button
                        size="sm"
                        variant={followingStatus[person._id] ? 'outline' : 'default'}
                        onClick={() => handleFollowToggle(person._id)}
                    >
                        {followingStatus[person._id] ? <UserCheck className="h-4 w-4 mr-2" /> : <UserPlus className="h-4 w-4 mr-2" />}
                        {followingStatus[person._id] ? 'Following' : 'Follow'}
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-center text-muted-foreground p-8">No {type} to show.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FollowList;