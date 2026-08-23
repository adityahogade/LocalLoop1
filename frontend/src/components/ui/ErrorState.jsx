export default function ErrorState({ title = 'Something went wrong', message = 'Please try again later.' }) {
  return (
    <div className="error-state" role="alert">
      <h3>{title}</h3>
      <p>{message}</p>
    </div>
  );
}
