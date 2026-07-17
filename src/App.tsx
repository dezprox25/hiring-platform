import { BrowserRouter } from 'react-router-dom'
import { DashboardLayout } from './components/dashboard-layout'

function App() {
  return (
    <BrowserRouter>
      <DashboardLayout role="admin" title="Hiring Application" body="Welcome to the hiring application dashboard." />
    </BrowserRouter>
  )
}

export default App
