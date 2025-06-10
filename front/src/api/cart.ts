export async function addToCart({
  userId,
  link,
  category,
  shipping,
  price,
}: {
  userId: number;
  link: string;
  category: string;
  shipping: string;
  price: number;
}) {
  const res = await fetch("http://localhost:3001/api/cart", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ userId, link, category, shipping, price }),
  });

  if (!res.ok) {
    throw new Error("Ошибка при добавлении в корзину");
  }

  return await res.json();
}
