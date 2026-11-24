import type { AllData, DatasetState } from '../hooks/useData'
import type { useFavorites } from '../hooks/useFavorites'

export interface PageProps {
  data: AllData
  state: DatasetState
  favorites: ReturnType<typeof useFavorites>
  query: string
  onOpenDataPanel: () => void
}
