export default function SearchInput({ value, onChange, placeholder = 'Search', ...props }) {
  return (
    <label className="search-input" aria-label={placeholder}>
      <span aria-hidden="true">⌕</span>
      <input type="search" value={value} onChange={onChange} placeholder={placeholder} {...props} />
    </label>
  );
}
