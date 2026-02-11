import { useState } from 'react'
import { ThemeToggle } from './components/layout/ThemeToggle'
import { RoutesPage } from '@/pages/RoutesPage'
import { RouteFormPage } from '@/pages/RouteFormPage'
import { RequestsPage } from '@/pages/RequestsPage'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Network, Clock } from 'lucide-react'

type Page = 'routes' | 'requests' | 'route-form'

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('routes')

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">HookNorton</h1>
          <ThemeToggle />
        </div>
      </header>

      {/* Navigation */}
      <div className="border-b border-border px-6">
        <Tabs value={currentPage} onValueChange={(value) => setCurrentPage(value as Page)}>
          <TabsList>
            <TabsTrigger value="routes" className="gap-2">
              <Network className="h-4 w-4" />
              Routes
            </TabsTrigger>
            <TabsTrigger value="requests" className="gap-2">
              <Clock className="h-4 w-4" />
              Requests
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        {currentPage === 'routes' && (
          <RoutesPage onNavigateTo={(page) => setCurrentPage(page as Page)} />
        )}
        {currentPage === 'requests' && <RequestsPage />}
        {currentPage === 'route-form' && (
          <RouteFormPage
            onSuccess={() => setCurrentPage('routes')}
            onCancel={() => setCurrentPage('routes')}
          />
        )}
      </main>
    </div>
  )
}

export default App


