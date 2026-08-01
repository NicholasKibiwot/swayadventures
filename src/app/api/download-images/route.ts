import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const images = [
{
  url: 'https://img.rocket.new/generatedImages/rocket_gen_img_12268b097-1774353475904.png',
  filename: 'hero-savanna-sunrise.png'
},
{
  url: 'https://img.rocket.new/generatedImages/rocket_gen_img_199e15cc9-1772249597155.png',
  filename: 'tour-maasai-mara-migration.png'
},
{
  url: 'https://images.unsplash.com/photo-1669517270484-df54ad8d54c8',
  filename: 'tour-diani-beach.jpg'
},
{
  url: "https://img.rocket.new/generatedImages/rocket_gen_img_1d8fedd4d-1768463726417.png",
  filename: 'tour-mount-kenya-trek.jpg'
},
{
  url: "https://img.rocket.new/generatedImages/rocket_gen_img_15c5a2192-1778354456644.png",
  filename: 'tour-amboseli-elephants.jpg'
},
{
  url: 'https://img.rocket.new/generatedImages/rocket_gen_img_1b45a1896-1778354456427.png',
  filename: 'tour-lamu-island.png'
},
{
  url: 'https://images.unsplash.com/photo-1666112308252-807feffd672d',
  filename: 'tour-tsavo-elephants.jpg'
},
{
  url: 'https://img.rocket.new/generatedImages/rocket_gen_img_149bfabd5-1772185253146.png',
  filename: 'hotel-sarova-stanley.png'
},
{
  url: "https://images.unsplash.com/photo-1704495160630-621ce259fc53",
  filename: 'hotel-hemingways-watamu.png'
},
{
  url: 'https://img.rocket.new/generatedImages/rocket_gen_img_1fad7d61b-1772249789689.png',
  filename: 'hotel-angama-mara.png'
},
{
  url: 'https://images.unsplash.com/photo-1603877797446-9a86f1076872',
  filename: 'hotel-giraffe-manor.jpg'
},
{
  url: 'https://img.rocket.new/generatedImages/rocket_gen_img_1050f9f02-1777846977357.png',
  filename: 'testimonial-amelia.png'
},
{
  url: 'https://images.unsplash.com/photo-1606070348308-8f4ed2f9a06d',
  filename: 'testimonial-rajiv.jpg'
},
{
  url: 'https://img.rocket.new/generatedImages/rocket_gen_img_1e91f72fe-1772071256926.png',
  filename: 'testimonial-sophie.png'
},
{
  url: "https://img.rocket.new/generatedImages/rocket_gen_img_19b8600b4-1782676813250.png",
  filename: 'category-personal-getaways.jpg'
},
{
  url: "https://images.unsplash.com/photo-1586105169136-3bb11a83743b",
  filename: 'category-group-retreats.png'
},
{
  url: 'https://img.rocket.new/generatedImages/rocket_gen_img_1728a0b60-1775670014180.png',
  filename: 'why-choose-us-guide.png'
},
{
  url: "https://img.rocket.new/generatedImages/rocket_gen_img_199e15cc9-1772249597155.png",
  filename: 'tours-maasai-mara-migration.png'
},
{
  url: 'https://images.unsplash.com/photo-1591795001901-6c99ec0e6fee',
  filename: 'tours-diani-beach.jpg'
},
{
  url: 'https://images.unsplash.com/photo-1498235100799-e1d92d0f4d88',
  filename: 'tours-mount-kenya.jpg'
},
{
  url: "https://img.rocket.new/generatedImages/rocket_gen_img_172c7497d-1784961915987.png",
  filename: 'tours-amboseli-elephants.png'
},
{
  url: 'https://images.unsplash.com/photo-1717916434211-2e17c91cb0cc',
  filename: 'tours-lamu-town.jpg'
},
{
  url: "https://img.rocket.new/generatedImages/rocket_gen_img_1763bbe9b-1783704506255.png",
  filename: 'tours-tsavo-elephants.jpg'
},
{
  url: 'https://images.unsplash.com/photo-1558328713-bc904dce9bf4',
  filename: 'tours-naivasha-lake.jpg'
},
{
  url: "https://img.rocket.new/generatedImages/rocket_gen_img_17aef986f-1772148463876.png",
  filename: 'tours-samburu-giraffe.jpg'
},
{
  url: 'https://images.unsplash.com/photo-1542936586-2620482f0690',
  filename: 'tours-hero-savanna.jpg'
}];


export async function GET() {
  const imagesDir = path.join(process.cwd(), 'public', 'assets', 'images');

  if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
  }

  const results: {filename: string;status: string;error?: string;}[] = [];

  for (const img of images) {
    const filePath = path.join(imagesDir, img.filename);
    if (fs.existsSync(filePath)) {
      results.push({ filename: img.filename, status: 'already_exists' });
      continue;
    }
    try {
      const res = await fetch(img.url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buffer = Buffer.from(await res.arrayBuffer());
      fs.writeFileSync(filePath, buffer);
      results.push({ filename: img.filename, status: 'downloaded' });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      results.push({ filename: img.filename, status: 'error', error: message });
    }
  }

  return NextResponse.json({ results });
}