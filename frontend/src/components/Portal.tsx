import ReactDOM from 'react-dom';

export const Portal = ({ children }: { children: React.ReactNode }) => {
  const portalRoot = document.body;
  return ReactDOM.createPortal(children, portalRoot);
};