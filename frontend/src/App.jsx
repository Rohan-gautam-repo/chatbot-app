import { BrowserRouter as Router } from 'react-router-dom';
import AuthProvider from './context/AuthProvider';
import Routes from './Routes';
import ChatSessionProvider from './context/ChatSessionProvider';

function App() {
  return (
    <Router>
      <AuthProvider>
        <ChatSessionProvider>
          <Routes />
        </ChatSessionProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
