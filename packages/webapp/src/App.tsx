import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import HomePage from './pages/Home'
import RegisterPage from './pages/Register'
import AffiliatesPage from './pages/Affiliates'
import MyAffiliatePage from './pages/MyAffiliate'
import AffiliateDetailPage from './pages/AffiliateDetail'
import DocsPage from './pages/Docs'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/affiliates" element={<AffiliatesPage />} />
        <Route path="/me" element={<MyAffiliatePage />} />
        <Route path="/affiliate/:address" element={<AffiliateDetailPage />} />
        <Route path="/docs" element={<DocsPage />} />
        <Route path="/docs/:section" element={<DocsPage />} />
      </Route>
    </Routes>
  )
}
