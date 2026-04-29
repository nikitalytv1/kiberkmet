import express from 'express';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { lat, lon } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({
        error: 'lat and lon are required'
      });
    }

    const base = 'https://dev-rest.isric.org/soilgrids/v2.0';

    const physicalUrl =
      `${base}/properties/query?lon=${lon}&lat=${lat}` +
      `&property=bdod&property=clay&property=cfvo&property=sand&property=silt` +
      `&property=wv0010&property=wv0033&property=wv1500` +
      `&value=mean&value=Q0.05&value=Q0.95`;

    const chemicalUrl =
      `${base}/properties/query?lon=${lon}&lat=${lat}` +
      `&property=phh2o&property=cec&property=nitrogen&property=soc` +
      `&value=mean&value=Q0.05&value=Q0.95`;

    const classificationUrl =
      `${base}/classification/query?lon=${lon}&lat=${lat}`;

    const derivedUrl =
      `${base}/properties/query?lon=${lon}&lat=${lat}` +
      `&property=ocd&property=ocs` +
      `&value=mean&value=Q0.05&value=Q0.95`;

    const [physicalRes, chemicalRes, classificationRes, derivedRes] =
      await Promise.all([
        fetch(physicalUrl),
        fetch(chemicalUrl),
        fetch(classificationUrl),
        fetch(derivedUrl)
      ]);

    if (!physicalRes.ok) throw new Error('Physical soil failed');
    if (!chemicalRes.ok) throw new Error('Chemical soil failed');
    if (!classificationRes.ok) throw new Error('Classification failed');
    if (!derivedRes.ok) throw new Error('Derived soil failed');

    const [physical, chemical, classification, derived] =
      await Promise.all([
        physicalRes.json(),
        chemicalRes.json(),
        classificationRes.json(),
        derivedRes.json()
      ]);

    return res.json({
      physical,
      chemical,
      classification,
      derived
    });
  } catch (err) {
    return res.status(500).json({
      error: err.message
    });
  }
});

export default router;