export type StandardItem = {
  tag: string;
  title: string;
  desc: string;
};

export default function ReviewStandardsCards({ items }: { items: StandardItem[] }) {
  return (
    <div className="reviews-grid" role="list" aria-label="Hospitality Standards & Commitments">
      {items.map(({ tag, title, desc }) => (
        <article className="review-card" key={tag} role="listitem">
          <div className="review-card-top">
            <span className="review-card-tag">{tag}</span>
          </div>
          <h3>{title}</h3>
          <p>{desc}</p>
        </article>
      ))}
    </div>
  );
}
