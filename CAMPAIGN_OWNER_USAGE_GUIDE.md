# Campaign Owner Feature - Usage Guide

## Overview

The Campaign Owner feature allows you to specify the name of the real person on whose behalf the AI is sending emails. This name will appear in email footers to provide transparency to recipients that they're receiving AI-generated emails on behalf of a specific person.

## What It Does

When you set a Campaign Owner, every email sent by the AI (both initial outreach and follow-up emails) will include a footer that says:

```
This email is being sent by AI on behalf of [Campaign Owner Name]
```

**Default Behavior:** If no Campaign Owner is set, the footer will display:
```
This email is being sent by AI on behalf of Davisulmer INC
```

---

## Step-by-Step Usage Instructions

### Setting Up Campaign Owner

#### Step 1: Navigate to Campaign Settings

1. Open your campaign dashboard
2. Select the campaign you want to configure
3. Click on the **Settings** tab in the campaign menu

#### Step 2: Access General Settings

1. In the Settings page, ensure you're on the **General** tab (it should be selected by default)
2. You'll see various campaign configuration fields

#### Step 3: Locate the Campaign Owner Field

1. Look for the **Campaign Owner** field - it's located near the top of the form
2. It appears right after the "Campaign Name" field and before "Campaign Status"
3. The field is marked as **(Optional)**

#### Step 4: Enter the Campaign Owner Name

1. Click on the **Campaign Owner** input field
2. Enter the full name of the person on whose behalf the AI will send emails
   - Example: "John Doe"
   - Example: "Sarah Johnson"
   - Example: "Michael Chen"

**Tips:**
- Use the person's full name for professionalism
- Ensure the spelling is correct
- This should be the name of a real person in your organization

#### Step 5: Save Your Changes

1. Scroll to the top-right of the General Settings page
2. Click the **Save Changes** button
3. Wait for the success notification: "Settings saved - Your changes have been saved successfully"

---

## Usage Examples

### Example 1: Sales Representative Campaign

**Scenario:** You're an SDR (Sales Development Representative) named Alex Thompson, and you want prospects to know that AI is assisting you.

**Steps:**
1. Navigate to your campaign settings
2. In the Campaign Owner field, enter: `Alex Thompson`
3. Click Save Changes

**Result:** Email footers will show:
```
This email is being sent by AI on behalf of Alex Thompson
```

---

### Example 2: Executive Campaign

**Scenario:** Your CEO, Jane Williams, wants to reach out to potential partners, and you're managing the AI-powered campaign on her behalf.

**Steps:**
1. Navigate to the campaign settings
2. In the Campaign Owner field, enter: `Jane Williams`
3. Click Save Changes

**Result:** Email footers will show:
```
This email is being sent by AI on behalf of Jane Williams
```

---

### Example 3: Team Campaign

**Scenario:** You want to use the default company name instead of an individual.

**Steps:**
1. Navigate to the campaign settings
2. Leave the Campaign Owner field **empty** (or clear any existing value)
3. Click Save Changes

**Result:** Email footers will show the default:
```
This email is being sent by AI on behalf of Davisulmer INC
```

---

## API Integration Guide

If you're integrating with the API directly, here's how to work with the Campaign Owner field.

### Get Campaign Settings (includes Campaign Owner)

```bash
GET /campaign-settings/by-campaign/{campaign_id}
```

**Response:**
```json
{
  "id": "123abc",
  "campaign_id": "campaign_456",
  "general": { ... },
  "materials": { ... },
  "schedule": { ... },
  "others": { ... },
  "campaign_owner": "John Doe",
  "created_at": "2025-01-15T10:30:00Z",
  "updated_at": "2025-01-15T14:45:00Z"
}
```

### Update Campaign Owner

```bash
PUT /campaign-settings/{settings_id}
```

**Request Body:**
```json
{
  "campaign_owner": "Jane Smith"
}
```

**Full Example with curl:**
```bash
curl -X PUT "https://your-api-url/campaign-settings/settings_123" \
  -H "Content-Type: application/json" \
  -d '{
    "campaign_owner": "Jane Smith"
  }'
```

---

## Best Practices

### 1. Use Real Names
Always use the real name of the person who would logically be sending these emails. This builds trust with recipients.

**Good:**
- "John Doe" (actual SDR)
- "Sarah Johnson" (actual Account Executive)

**Avoid:**
- "AI Bot"
- "Automation System"
- Generic names that don't represent real people

### 2. Keep It Professional
Use full names or professional formats.

**Recommended:**
- "Michael Chen"
- "Dr. Emily Rodriguez"
- "James T. Kirk"

**Not Recommended:**
- "Mike"
- "Em"
- "JimBob"

### 3. Update When Ownership Changes
If the person managing the campaign changes, remember to update the Campaign Owner field.

### 4. Consider Your Audience
Think about who your recipients expect to hear from:
- For B2B sales: Use the name of the sales rep or account owner
- For executive outreach: Use the executive's name
- For company-wide campaigns: You may use the default company name

### 5. Test Before Going Live
After setting the Campaign Owner:
1. Send a test email to yourself
2. Verify the footer displays correctly
3. Ensure the name is spelled correctly

---

## Troubleshooting

### Issue: Campaign Owner not appearing in emails

**Solution:**
1. Verify you clicked "Save Changes" after entering the name
2. Check for the success notification
3. Try refreshing the settings page to confirm the value was saved
4. If using the API, verify your PUT request returned a 200 status code

### Issue: Old name still appearing in emails

**Solution:**
1. Clear the Campaign Owner field completely
2. Enter the new name
3. Click Save Changes
4. Wait a few moments for the changes to propagate

### Issue: Cannot save Campaign Owner

**Solution:**
1. Check that other required fields are filled (Campaign Name, Agent Name, etc.)
2. Ensure there are no validation errors on the page
3. Try refreshing the page and entering the value again
4. Check browser console for any JavaScript errors

---

## Frequently Asked Questions

**Q: Is Campaign Owner required?**
A: No, it's optional. If not set, the system uses the default company name "Davisulmer INC".

**Q: Can I use a company name instead of a person's name?**
A: Yes, you can enter any text. However, for transparency and trust, we recommend using real people's names.

**Q: Does changing Campaign Owner affect existing sent emails?**
A: No, only new emails sent after the change will use the updated Campaign Owner name.

**Q: Can I have different Campaign Owners for different campaigns?**
A: Yes! Each campaign has its own Campaign Owner setting.

**Q: Where exactly does the Campaign Owner appear?**
A: It appears in the footer of every email sent by the AI, in the format: "This email is being sent by AI on behalf of [Campaign Owner]"

**Q: Can I use special characters or emojis?**
A: While technically possible, we recommend sticking to standard letters and common punctuation for professionalism.

---

## Related Settings

While configuring Campaign Owner, you may also want to set:

- **Agent Name**: The name that appears in the email signature (usually the same as Campaign Owner)
- **Agent Email**: The reply-to email address
- **Agent Designation**: The job title that appears in the signature
- **Campaign Email**: The email address from which messages are sent

These settings work together to create a cohesive email identity.

---

## Support

If you encounter issues or have questions about the Campaign Owner feature:

1. Check this guide for troubleshooting steps
2. Verify all required fields in General Settings are complete
3. Contact your system administrator
4. Report issues at: https://github.com/anthropics/claude-code/issues

---

## Version History

- **v1.0** (February 2026): Initial release of Campaign Owner feature
  - Added optional Campaign Owner field to General Settings
  - Integrated with email footer generation
  - Full API support for GET/PUT operations
