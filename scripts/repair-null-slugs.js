const { PrismaClient } = require('@prisma/client');
function generateJobSlug(serviceType, itemCategory, cityName, identifier) {
  const sanitize = (str) => String(str || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const s = sanitize(serviceType);
  const c = sanitize(cityName);
  const id = sanitize(identifier);
  return `${s}-${c}-${id}`.replace(/--+/g, '-');
}

async function checkNullJobs() {
  const prisma = new PrismaClient();
  try {
    const nullJobs = await prisma.jobStory.findMany({
      where: { slug: null },
      include: { location: true }
    });

    console.log(`Found ${nullJobs.length} jobs with null slug:`);
    for (const j of nullJobs) {
      console.log(`- ID: ${j.id}, City: ${j.location?.cityName || 'Unknown'}, Service: ${j.serviceType}, Category: ${j.itemCategory}`);
    }

    if (nullJobs.length > 0) {
      console.log('\nAssigning canonical slugs to these legacy records...');
      for (const j of nullJobs) {
        const citySlug = j.location?.slug || 'federal-way';
        const service = j.serviceType || 'Junk Removal';
        const category = j.itemCategory || 'Hauling';
        const identifier = j.externalJobId || j.disposalReceipt || j.id.slice(-6);
        const slug = generateJobSlug(service, category, citySlug, identifier);

        await prisma.jobStory.update({
          where: { id: j.id },
          data: { slug }
        });
        console.log(`  ✓ Updated ${j.id} -> ${slug}`);
      }
      console.log('\nAll null slugs successfully repaired!');
    }
  } catch (err) {
    console.error('Error repairing slugs:', err);
  } finally {
    await prisma.$disconnect();
  }
}

checkNullJobs();
