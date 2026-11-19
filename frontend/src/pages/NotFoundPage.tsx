import { Link } from 'react-router-dom'
import { Home, Search, RotateCcw } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Card, CardContent } from '../components/ui/Card'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="max-w-md w-full text-center">
        <CardContent className="py-16">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/30">
            <Search className="h-10 w-10 text-primary-600" />
          </div>
          <h1 className="text-4xl font-bold mb-2">404</h1>
          <h2 className="text-xl font-semibold mb-4">Page Not Found</h2>
          <p className="text-muted-foreground mb-8">
            Sorry, we couldn't find the page you're looking for. It might have been moved or doesn't exist.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/">
              <Button className="gap-2">
                <Home className="h-4 w-4" />
                Go Home
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button variant="outline" className="gap-2">
                <RotateCcw className="h-4 w-4" />
                Dashboard
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}