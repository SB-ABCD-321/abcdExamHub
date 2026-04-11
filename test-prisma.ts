import { db } from './src/lib/prisma';

async function main() {
  try {
    const settings = await db.siteSetting.findFirst();
    console.log("SiteSetting keys from DB:", Object.keys(settings || {}));
    
    // Check DMMF if possible
    const dmmf = (db as any)._dmmf;
    if (dmmf) {
      const model = dmmf.datamodel.models.find((m: any) => m.name === 'SiteSetting');
      console.log("Model Fields in DMMF:", model.fields.map((f: any) => f.name).join(', '));
    } else {
      console.log("DMMF not available on this instance");
    }
  } catch (e) {
    console.error("Test execution failed:", e);
  } finally {
    // Note: db might be global, so we don't necessarily want to disconnect if it's reused, 
    // but for a script it's fine.
    await (db as any).$disconnect?.();
  }
}

main();
