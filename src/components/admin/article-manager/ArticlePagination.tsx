import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
interface ArticlePaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}
export const ArticlePagination = ({
  currentPage,
  totalPages,
  onPageChange
}: ArticlePaginationProps) => {
  if (totalPages <= 1) return null;
  return <Pagination className="mt-8 bg-gray-50">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious onClick={() => onPageChange(Math.max(1, currentPage - 1))} className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''} />
        </PaginationItem>

        {[...Array(totalPages)].map((_, i) => <PaginationItem key={i + 1}>
            <PaginationLink onClick={() => onPageChange(i + 1)} isActive={currentPage === i + 1}>
              {i + 1}
            </PaginationLink>
          </PaginationItem>)}

        <PaginationItem>
          <PaginationNext onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))} className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''} />
        </PaginationItem>
      </PaginationContent>
    </Pagination>;
};