export default function Pagination({ currentPage = 1, totalPages = 1, onPageChange }) {
  return (
    <nav className="pagination" aria-label="Pagination">
      <button type="button" disabled={currentPage <= 1} onClick={() => onPageChange?.(currentPage - 1)}>Previous</button>
      <span>{currentPage} / {totalPages}</span>
      <button type="button" disabled={currentPage >= totalPages} onClick={() => onPageChange?.(currentPage + 1)}>Next</button>
    </nav>
  );
}
