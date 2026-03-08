import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Zap, BookOpen, Fingerprint, Eye, EyeOff } from 'lucide-react';
import Logo from '../assets/logos/medium-logo.svg';

// Import the global action
import { addToast } from '../features/toasts/toastSlice';
import { type AppDispatch, type RootState } from '../store';
import { loginUser, reset } from '../features/login/loginSlice';
import { FormButton } from '../components/Buttons/formButton';

export const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const { user, isLoading, isError, isSuccess, message } = useSelector(
    (state: RootState) => state.login
  );

  useEffect( () => {
    // handle login failure
    if (isError) {
      dispatch(addToast({
        message: message || 'Check your credentials and try again',
        type: 'failure'
      }));
      dispatch(reset());
    }

    // handle login success when user data is available
    if (isSuccess && user) {

      setUsername('');
      setPassword('');

      navigate('/');
      dispatch(reset());
    }
 }, [isError, isSuccess, user, message, dispatch, navigate]);

  const handleLogin = (e: React.SyntheticEvent) => {
    // prevents the screen from reloading
    e.preventDefault();
    
    // checking for empty fields
    if (!username.trim() || !password.trim()) {
      dispatch(addToast({ 
        message: "Please fill in all fields",
        type: 'failure' 
      }));
      return;
    }

    // sends the username and password to the async thunk
    dispatch(loginUser({ username, password }));
  };

  return (
    <div className="h-screen w-full flex justify-center items-center bg-bgrelative overflow-hidden ">

      {/* LEFT SIDE: Branding */}
      <div className="m-6 hidden lg:flex h-[95vh] w-[70%] bg-surface border-2 rounded-lg border-light/20 flex-col p-16 justify-between relative">
        <div>
          <img src={Logo} alt="EduSync" className="w-80 -ml-7 mb-5" />
          <div className="space-y-8">
            <section>
              <h2 className="text-primary font-bold uppercase tracking-[0.2em] text-sm mb-3">What is EduSync?</h2>
              <h1 className="text-4xl font-extrabold text-text-heading leading-tight mb-4 tracking-tight">
                A Unified Management <span className="text-primary">Ecosystem.</span>
              </h1>
              <p className="text-text-muted text-lg leading-relaxed text-justify">
                EduSync is a centralized Learning Management System (LMS) designed to synchronize the workflow between administrators, teachers, and students. It eliminates data fragmentation by providing a single, real-time source of truth for academic resources and progress tracking.
              </p>
            </section>

            <section className="space-y-6">
              <h2 className="text-primary font-bold uppercase tracking-[0.2em] text-sm">Core Capabilities</h2>
              <div className="flex flex-col gap-1">
                {[
                  { icon: <Fingerprint size={22} />, title: 'Role-Based Synchronization', desc: 'Automatically syncs specific dashboards for Admins, Staff, and Students based on their organizational ID.' },
                  { icon: <BookOpen size={22} />, title: 'Resource Repository', desc: 'Acts as a central hub for course materials, preventing the loss of educational data across different sessions.' },
                  { icon: <Zap size={22} />, title: 'Automated Oversight', desc: 'Streamlines administrative tasks like grading and performance monitoring to reduce manual educator workload.' }
                ].map((item) => (
                  <div key={item.title} className="flex items-start gap-4 p-4 rounded-2xl hover:bg-white/5 transition-colors group">
                    <div className="mt-1 text-primary group-hover:scale-110 transition-transform">{item.icon}</div>
                    <div>
                      <h3 className="text-text-heading font-bold">{item.title}</h3>
                      <p className="text-text-muted text-sm leading-snug text-justify">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
        <div className="pt-8 border-t-2 border-light/20 flex items-center gap-3">
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse shadow-[0_0_10px_var(--color-primary)]" />
          <p className="text-text-muted text-xs tracking-widest uppercase opacity-60">
            Systems Operational • v2.0 Interim Build
          </p>
        </div>
      </div>

      {/* RIGHT SIDE: Login panel */}
      <div className="w-full lg:w-[30%] flex flex-col items-center justify-center p-8 bg-bg">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex justify-center mb-12">
            <img src={Logo} alt="EduSync" className="w-64" />
          </div>
          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-4xl font-bold text-text-heading mb-3 tracking-tight">Sign In</h2>
            <p className="text-text-muted">Access your organizational dashboard.</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-text-heading uppercase tracking-widest ml-1 opacity-70">Username</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors" size={20} />
                <input 
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Username"
                  className="w-full bg-surface border-2 border-light/20 rounded-2xl py-4.5 pl-12 pr-4 text-text-heading placeholder:text-text-muted/40 outline-none  focus:border-primary focus:text-primary transition-all duration-450"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-text-heading uppercase tracking-widest ml-1 opacity-70">Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors" size={20} />
                <input 
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-surface border-2 border-light/20 rounded-2xl py-4.5 pl-12 pr-12 text-text-heading placeholder:text-text-muted/40 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:text-primary transition-all duration-450"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-primary cursor-pointer transition-colors outline-none"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
            <FormButton 
              type="submit" 
              isLoading={isLoading} 
              className="mt-10 w-full"
            >
              Log Into EduSync
            </FormButton>
          </form>
          <footer className="mt-16 text-center lg:text-left">
            <p className="text-sm text-text-muted leading-relaxed opacity-60 text-justify">
              If you have forgotten your credentials, please reach out to your organization's IT Administration.
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
};