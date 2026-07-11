/**
 * トップ背景の「記念画像ウォール」。
 * public/gallery のチェキ画像を、少し傾けて小さく敷き詰める（装飾・低透明度）。
 */
export function GalleryBackground({ images }: { images: string[] }) {
  if (images.length === 0) return null;
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden opacity-20"
    >
      <div className="grid -rotate-3 scale-110 grid-cols-3 gap-3 p-3 sm:grid-cols-4 md:grid-cols-6">
        {images.map((src, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={src}
            src={src}
            alt=""
            loading="lazy"
            className="w-full rounded-md bg-white shadow-sm"
            style={{ transform: `rotate(${((i * 53) % 15) - 7}deg)` }}
          />
        ))}
      </div>
    </div>
  );
}
