import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ParceleTest from './ParceleTest';
import ParcelPage from './ParcelPage';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ParceleTest />} />
        <Route path="/parcela/:id" element={<ParcelPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;