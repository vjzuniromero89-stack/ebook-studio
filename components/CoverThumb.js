'use client';
// Miniatura de portada renderizada con el mismo HTML del libro
export default function CoverThumb({ id, v }) {
  return (
    <div className="book-thumb">
      <iframe src={`/api/ebooks/${id}/preview?cover=1&v=${v || ''}`} title="portada" loading="lazy" />
    </div>
  );
}
