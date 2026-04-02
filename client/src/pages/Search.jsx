import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { searchUsers, clearSearchResults } from '../features/users/usersSlice';
import { Card, Avatar, Spinner, Input, Button } from '../components/ui';
import FollowButton from '../components/FollowButton';
import './Search.css';

function Search() {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const { searchResults, pagination, isLoading, error } = useSelector((state) => state.users);
  const { user: authUser } = useSelector((state) => state.auth);

  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [skills, setSkills] = useState(searchParams.get('skills') || '');

  useEffect(() => {
    const q = searchParams.get('q') || '';
    const skillsParam = searchParams.get('skills') || '';
    const page = parseInt(searchParams.get('page')) || 1;

    if (q || skillsParam) {
      dispatch(searchUsers({ q, skills: skillsParam, page, limit: 10 }));
    }

    return () => {
      dispatch(clearSearchResults());
    };
  }, [dispatch, searchParams]);

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query.trim());
    if (skills.trim()) params.set('skills', skills.trim());
    params.set('page', '1');
    setSearchParams(params);
  };

  const handlePageChange = (newPage) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage.toString());
    setSearchParams(params);
  };

  const hasSearched = searchParams.has('q') || searchParams.has('skills');

  return (
    <div className="search">
      <Card className="search__card">
        <h1 className="search__title">Find Developers</h1>

        <form onSubmit={handleSearch} className="search__form">
          <Input
            placeholder="Search by name..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Input
            placeholder="Filter by skills (e.g., React, Node.js)..."
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
          />
          <Button type="submit" loading={isLoading}>
            Search
          </Button>
        </form>
      </Card>

      {error && (
        <div className="search__error">
          <p>{error}</p>
        </div>
      )}

      {isLoading && (
        <div className="search__loading">
          <Spinner size="lg" />
        </div>
      )}

      {!isLoading && hasSearched && searchResults.length === 0 && (
        <div className="search__empty">
          <p>No developers found matching your criteria.</p>
        </div>
      )}

      {!isLoading && searchResults.length > 0 && (
        <div className="search__results">
          {searchResults.map((user) => (
            <Card key={user.id || user._id} className="search__result-card">
              <div className="search__result">
                <Link to={`/users/${user.id || user._id}`} className="search__result-link">
                  <Avatar name={user.name} src={user.avatar} size="lg" />
                  <div className="search__result-info">
                    <h3 className="search__result-name">{user.name}</h3>
                    {user.bio && <p className="search__result-bio">{user.bio}</p>}
                    {user.skills?.length > 0 && (
                      <div className="search__result-skills">
                        {user.skills.slice(0, 5).map((skill, index) => (
                          <span key={index} className="search__result-skill">
                            {skill}
                          </span>
                        ))}
                        {user.skills.length > 5 && (
                          <span className="search__result-skill search__result-skill--more">
                            +{user.skills.length - 5}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </Link>
                {authUser && authUser.id !== (user.id || user._id) && (
                  <FollowButton 
                    userId={user.id || user._id} 
                    isFollowing={user.isFollowing}
                  />
                )}
              </div>
            </Card>
          ))}

          {pagination.pages > 1 && (
            <div className="search__pagination">
              <Button
                variant="secondary"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
              >
                Previous
              </Button>
              <span className="search__pagination-info">
                Page {pagination.page} of {pagination.pages}
              </span>
              <Button
                variant="secondary"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.pages}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Search;
