# AI Dashboard Generator

A Lovable.ai-inspired system that generates dynamic dashboards from natural language prompts. This system automatically matches user prompts to dashboard templates and renders interactive charts using React and Recharts.

## Features

- **Natural Language Processing**: Enter prompts like "Show me sales performance dashboard" to get relevant templates
- **AI-Powered Matching**: Uses keyword matching with optional OpenAI fallback for complex queries
- **Dynamic Chart Rendering**: Supports BarChart, LineChart, PieChart, AreaChart, and ScatterChart
- **Template Management**: Load dashboard templates from ZIP files or use built-in examples
- **Responsive Design**: Built with Tailwind CSS and shadcn/ui components
- **TypeScript**: Full type safety and IntelliSense support

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Build the project:
```bash
npm run build
```

3. Start the development server:
```bash
npm run dev
```

4. Open `http://localhost:3000` in your browser

## Usage

### Basic Usage

1. Enter a natural language prompt in the input field (e.g., "sales performance dashboard")
2. Click "Generate Dashboard"
3. View the generated dashboard with interactive charts

### Advanced Features

#### OpenAI Integration

For enhanced AI matching, set up your OpenAI API key:

```bash
export REACT_APP_OPENAI_API_KEY=your_openai_api_key
```

Then restart the development server.

#### Loading Custom Templates

Create a ZIP file containing JSON template definitions:

```json
{
  "id": "custom-template",
  "name": "My Custom Dashboard",
  "description": "Custom dashboard description",
  "category": "custom",
  "tags": ["custom", "example"],
  "layout": {
    "gridColumns": 12,
    "gridRows": 8
  },
  "components": [
    {
      "id": "chart-1",
      "type": "bar",
      "title": "Sample Chart",
      "dataSource": "sample-data",
      "config": {
        "xAxis": "name",
        "dataKey": "value"
      },
      "position": {
        "x": 0,
        "y": 0,
        "width": 6,
        "height": 4
      }
    }
  ]
}
```

## Project Structure

```
src/
├── components/
│   ├── Dashboard.tsx          # Main dashboard component
│   └── ui/
│       └── card.tsx          # UI components
├── types/
│   └── dashboard.ts          # TypeScript type definitions
├── utils/
│   ├── templateLoader.ts     # ZIP file template loading
│   ├── promptMatcher.ts      # AI and keyword matching
│   └── dataFetcher.ts        # Data fetching utilities
├── lib/
│   └── utils.ts              # Utility functions
├── App.tsx                   # Main application component
├── index.tsx                 # React app entry point
└── index.css                 # Global styles
```

## Architecture

### Core Components

1. **TemplateLoader**: Loads dashboard templates from ZIP files and manages template collections
2. **PromptMatcher**: Matches natural language prompts to templates using keywords or AI
3. **Dashboard**: Renders dashboard templates with dynamic chart components
4. **DataFetcher**: Provides sample data and handles data loading for charts

### Supported Chart Types

- **BarChart**: For categorical comparisons
- **LineChart**: For trend analysis and time series
- **PieChart**: For proportional data visualization
- **AreaChart**: For stacked data and trends
- **ScatterChart**: For correlation analysis

### Template Schema

Each dashboard template includes:

```typescript
interface DashboardTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  layout: {
    gridColumns: number;
    gridRows: number;
  };
  components: ChartComponent[];
  thumbnail?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

## Customization

### Adding New Chart Types

1. Update the `ChartComponent` type in `types/dashboard.ts`
2. Add the new chart type to the `ChartRenderer` component in `Dashboard.tsx`
3. Import the new chart component from Recharts

### Custom Data Sources

Extend the `DATA_SOURCES` object in `utils/dataFetcher.ts`:

```typescript
export const DATA_SOURCES = {
  // ... existing sources
  'my-custom-data': () => fetchMyCustomData()
};
```

### Styling

The project uses Tailwind CSS with shadcn/ui components. Customize styles by:

1. Modifying `tailwind.config.js` for theme extensions
2. Adding custom CSS in `src/index.css`
3. Updating component styles in individual component files

## API Reference

### TemplateLoader

```typescript
const loader = new TemplateLoader();
await loader.loadFromZip({ zipFilePath: 'path/to/templates.zip' });
const templates = loader.getTemplates();
```

### PromptMatcher

```typescript
const matcher = new PromptMatcher('your-openai-api-key');
const result = await matcher.generateDashboardFromPrompt(prompt, templates);
```

### Dashboard Component

```typescript
<Dashboard
  template={selectedTemplate}
  data={dashboardData}
  onComponentUpdate={(componentId, data) => handleUpdate(componentId, data)}
/>
```

## Examples

### Example Templates Included

1. **Sales Performance Dashboard**: Revenue, profit trends, and product breakdown
2. **User Analytics Dashboard**: Device usage and session analytics
3. **Financial Overview Dashboard**: Revenue trends and geographic performance

### Example Prompts

- "Show me sales performance"
- "User analytics dashboard"
- "Financial overview with trends"
- "Revenue breakdown by product"
- "Monthly performance metrics"

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Submit a pull request

## License

MIT License - feel free to use this project for your own applications.

## Support

For questions or issues, please open an issue on the GitHub repository.
