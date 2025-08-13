import { useEffect, useState } from "react";
import axios from "axios";

function App() {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    axios.get("http://localhost:8000/posts")
      .then(res => setPosts(res.data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="container mt-4">
      <h1 className="mb-4 text-center">Danh sách bài viết</h1>
      <div className="row row-cols-1 row-cols-md-3 g-4">
        {posts.map(post => (
          <div key={post.id} className="col-md-4 mb-3">
            <div className="card p-3">
              <h5>{post.title}</h5>
              <p>{post.content}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
