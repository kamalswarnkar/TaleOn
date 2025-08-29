import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useToast } from '../../components/UI/Toast';

const AuthSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { success, error } = useToast();

  useEffect(() => {
    const token = searchParams.get('token');
    const userParam = searchParams.get('user');

    if (token && userParam) {
      try {
        const user = JSON.parse(decodeURIComponent(userParam));
        
        // Store user data and token
        sessionStorage.setItem('user', JSON.stringify({ ...user, token }));
        sessionStorage.setItem('token', token);
        
        success('Google login successful! Welcome back!');
        
        // Redirect to home page
        setTimeout(() => {
          navigate('/');
        }, 1500);
        
      } catch (err) {
        console.error('Error parsing user data:', err);
        error('Failed to process login data');
        navigate('/login');
      }
    } else {
      error('Invalid login response');
      navigate('/login');
    }
  }, [searchParams, navigate, success, error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#1a1a2e] to-[#16213e] flex items-center justify-center">
      <div className="bg-[#1a1a2e] p-8 rounded-lg shadow-2xl border border-[#333] max-w-md w-full">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-2">Login Successful!</h2>
          <p className="text-gray-300 mb-4">Processing your login...</p>
          
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00c3ff] mx-auto"></div>
        </div>
      </div>
    </div>
  );
};

export default AuthSuccess;


