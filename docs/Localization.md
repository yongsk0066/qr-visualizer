# Localization Plan for QR Visualizer

## Overview
This document outlines the internationalization (i18n) plan for QR Visualizer, focusing on adding English language support while maintaining the existing Korean interface.

## Architecture Decision

### Routing Strategy: URL-based Language Selection
We will use **route-based localization** with the following URL structure:
- `/ko/*` - Korean version (default)
- `/en/*` - English version

**Rationale:**
- SEO-friendly with separate URLs for each language
- Shareable links maintain language preference
- Compatible with GitHub Pages static hosting
- Clear language indication in URL

## Implementation Approach

### Work Breakdown Structure

The localization will be implemented in a **hierarchical, component-by-component** approach:

```
1. QREncodingProcess
   ├── SettingsColumn
   ├── DataEncodingColumn
   ├── ErrorCorrectionColumn
   ├── MessageConstructionColumn
   ├── ModulePlacementColumn
   ├── MaskingColumn
   └── FinalGenerationColumn

2. QRDetectProcess
   ├── ImageInputColumn
   │   ├── FileInput
   │   ├── CameraInput
   │   └── VirtualCameraInput
   ├── GrayscaleColumn
   ├── BinarizationColumn
   ├── FinderDetectionColumn
   ├── RefinedHomographyColumn
   └── SamplingColumn

3. QRDecodeProcess
   ├── FormatExtractionColumn
   ├── VersionExtractionColumn
   ├── MaskRemovalColumn
   ├── DataReadingColumn
   ├── ErrorCorrectionColumn
   └── DataExtractionColumn
```

### Process for Each Component

For each Column component:

1. **Audit Phase**
   - Identify all Korean text in the component
   - Document all text that needs translation
   - Include:
     - UI labels and buttons
     - Error messages
     - Tooltips and help text
     - Technical explanations
     - Debug information

2. **Translation Phase**
   - Create English translations for identified text
   - Maintain technical accuracy
   - Preserve the educational nature of explanations

3. **Implementation Phase**
   - Implement language switching logic
   - Korean text remains hardcoded (no changes)
   - English text conditionally rendered based on route

## Technical Implementation

### Language Context
```typescript
interface LanguageContextType {
  language: 'ko' | 'en';
  t: (key: string) => string;
}
```

### Translation Structure
```typescript
// Each component will have its own translation object
const translations = {
  en: {
    title: "Step 1: Data Analysis",
    description: "Analyze input data and select optimal encoding mode",
    // ...
  }
};
```

### Component Pattern
```typescript
function SomeColumn() {
  const { language } = useLanguage();
  
  return (
    <div>
      <h2>{language === 'en' ? 'English Title' : '한국어 제목'}</h2>
    </div>
  );
}
```

## Scope

### In Scope
- All user-facing text in the three main processes
- Column titles and descriptions
- Technical explanations
- Error messages
- Button labels
- Sample data labels

### Out of Scope (Phase 1)
- Code comments
- Console logs
- Test files
- Documentation files (except this plan)
- Variable names

## Timeline Estimate

Based on component count:
- **QREncodingProcess**: 7 columns × ~2 hours = 14 hours
- **QRDetectProcess**: 6 columns × ~2 hours = 12 hours  
- **QRDecodeProcess**: 6 columns × ~2 hours = 12 hours
- **Common components & routing**: 8 hours
- **Testing & refinement**: 8 hours

**Total estimate**: ~54 hours of work

## Success Criteria

- [ ] All three processes fully translated to English
- [ ] Language switching works via URL routing
- [ ] No Korean text visible when in English mode
- [ ] Technical accuracy maintained in translations
- [ ] Educational value preserved
- [ ] No regression in existing Korean interface

## Next Steps

1. Set up routing infrastructure
2. Create language context provider
3. Begin with QREncodingProcess
4. Proceed column by column as outlined above
5. Test each process thoroughly
6. Deploy to GitHub Pages with proper routing config

## Notes

- Korean interface remains unchanged (no extraction to translation files)
- English translations will be inline within components
- Focus on maintaining educational clarity over literal translation
- Technical terms should follow industry standards