// Mock for framer-motion
const React = require('react');

const motion = {
  div: React.forwardRef(({ children, ...props }, ref) =>
    React.createElement('div', { ref, ...props }, children)
  ),
  span: React.forwardRef(({ children, ...props }, ref) =>
    React.createElement('span', { ref, ...props }, children)
  ),
  p: React.forwardRef(({ children, ...props }, ref) =>
    React.createElement('p', { ref, ...props }, children)
  ),
  button: React.forwardRef(({ children, ...props }, ref) =>
    React.createElement('button', { ref, ...props }, children)
  ),
  ul: React.forwardRef(({ children, ...props }, ref) =>
    React.createElement('ul', { ref, ...props }, children)
  ),
  li: React.forwardRef(({ children, ...props }, ref) =>
    React.createElement('li', { ref, ...props }, children)
  ),
  a: React.forwardRef(({ children, ...props }, ref) =>
    React.createElement('a', { ref, ...props }, children)
  ),
  img: React.forwardRef((props, ref) =>
    React.createElement('img', { ref, ...props })
  ),
  section: React.forwardRef(({ children, ...props }, ref) =>
    React.createElement('section', { ref, ...props }, children)
  ),
  article: React.forwardRef(({ children, ...props }, ref) =>
    React.createElement('article', { ref, ...props }, children)
  ),
  header: React.forwardRef(({ children, ...props }, ref) =>
    React.createElement('header', { ref, ...props }, children)
  ),
  footer: React.forwardRef(({ children, ...props }, ref) =>
    React.createElement('footer', { ref, ...props }, children)
  ),
  nav: React.forwardRef(({ children, ...props }, ref) =>
    React.createElement('nav', { ref, ...props }, children)
  ),
  main: React.forwardRef(({ children, ...props }, ref) =>
    React.createElement('main', { ref, ...props }, children)
  ),
  aside: React.forwardRef(({ children, ...props }, ref) =>
    React.createElement('aside', { ref, ...props }, children)
  ),
  table: React.forwardRef(({ children, ...props }, ref) =>
    React.createElement('table', { ref, ...props }, children)
  ),
  tr: React.forwardRef(({ children, ...props }, ref) =>
    React.createElement('tr', { ref, ...props }, children)
  ),
  td: React.forwardRef(({ children, ...props }, ref) =>
    React.createElement('td', { ref, ...props }, children)
  ),
  th: React.forwardRef(({ children, ...props }, ref) =>
    React.createElement('th', { ref, ...props }, children)
  ),
};

const AnimatePresence = ({ children }) => children;

const useAnimation = () => ({
  start: jest.fn(),
  stop: jest.fn(),
  set: jest.fn(),
});

const useMotionValue = (initial) => ({
  get: () => initial,
  set: jest.fn(),
  onChange: jest.fn(),
});

const useTransform = () => ({
  get: () => 0,
  set: jest.fn(),
});

const useSpring = () => ({
  get: () => 0,
  set: jest.fn(),
});

const useInView = () => [null, true];
const useScroll = () => ({ scrollY: { get: () => 0 }, scrollX: { get: () => 0 } });

module.exports = {
  motion,
  AnimatePresence,
  useAnimation,
  useMotionValue,
  useTransform,
  useSpring,
  useInView,
  useScroll,
};
