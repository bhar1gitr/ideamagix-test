const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Tag = require('../models/Tag')
const Lead = require('../models/Leads');
const { exportLeadsToExcel, importLeadsFromExcel } = require('../utils/excel');
const auth = require('../middleware/auth')

router.get('/export', auth, async (req, res) => {
    try {
        const leads = await Lead.find().populate('assignedTo tags');
        const formattedLeads = leads.map((lead) => ({
            name: lead.name,
            email: lead.email,
            phone: lead.phone,
            source: lead.source,
            status: lead.status,
            tags: lead.tags.map(t => t.name).join(', '),
            assignedTo: lead.assignedTo?.name || '',
        }));

        const filePath = exportLeadsToExcel(formattedLeads);
        res.download(filePath, 'leads_export.xlsx', () => {
            fs.unlinkSync(filePath);
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to export leads' });
    }
});

const upload = multer({ dest: 'uploads/' });

router.post('/import', auth, upload.single('file'), async (req, res) => {
    try {
        const filePath = req.file.path;
        let rawData = importLeadsFromExcel(filePath); 

        const enrichedData = await Promise.all(
            rawData.map(async (lead) => {
                let tagIds = [];

                if (lead.tags && typeof lead.tags === 'string') {
                    const tagNames = lead.tags.split(',').map(t => t.trim());

                    tagIds = await Promise.all(tagNames.map(async (name) => {
                        let tag = await Tag.findOne({ name });
                        if (!tag) {
                            tag = await Tag.create({ name }); 
                        }
                        return tag._id;
                    }));
                }

                return {
                    ...lead,
                    tags: tagIds,
                };
            })
        );

        await Lead.insertMany(enrichedData);
        fs.unlinkSync(filePath);

        res.status(200).json({ message: 'Leads imported successfully', count: enrichedData.length });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to import leads' });
    }
});

module.exports = router;
