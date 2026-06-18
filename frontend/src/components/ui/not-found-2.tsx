import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import { HomeIcon, CompassIcon } from "lucide-react"

export function NotFound() {
  const { t } = useTranslation()

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden">
      <Empty>
        <EmptyHeader>
          <EmptyTitle className="mask-b-from-20% mask-b-to-80% font-extrabold text-9xl">
            {t('not_found.title')}
          </EmptyTitle>
          <EmptyDescription className="-mt-8 text-nowrap text-foreground/80">
            {t('not_found.description')}
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <div className="flex gap-2">
            <Button asChild>
              <Link to="/">
                <HomeIcon className="size-4 mr-2" data-icon="inline-start" />
                {t('not_found.go_home')}
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/">
                <CompassIcon className="size-4 mr-2" data-icon="inline-start" />
                {t('not_found.explore')}
              </Link>
            </Button>
          </div>
        </EmptyContent>
      </Empty>
    </div>
  )
}
