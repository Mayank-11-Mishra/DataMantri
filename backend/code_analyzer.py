"""
Smart Code Analyzer for Dashboard Templates
Extracts themes, charts, and layouts from React dashboard code (e.g., Lovable exports)
"""

import re
import json
import esprima
from typing import Dict, List, Any, Optional
import logging

logger = logging.getLogger(__name__)


class DashboardCodeAnalyzer:
    """Analyzes React dashboard code to extract reusable patterns"""
    
    def __init__(self):
        self.colors = []
        self.chart_types = []
        self.layouts = []
        self.component_names = []
        
    def analyze(self, code: str, filename: str = "unknown") -> Dict[str, Any]:
        """
        Main analysis function
        Returns extracted themes, charts, and layouts
        """
        try:
            result = {
                'success': True,
                'filename': filename,
                'themes': self.extract_themes(code),
                'charts': self.extract_charts(code),
                'layouts': self.extract_layouts(code),
                'components': self.extract_components(code),
                'errors': []
            }
            
            logger.info(f"Successfully analyzed {filename}")
            return result
            
        except Exception as e:
            logger.error(f"Error analyzing code: {str(e)}")
            return {
                'success': False,
                'filename': filename,
                'error': str(e),
                'themes': [],
                'charts': [],
                'layouts': [],
                'components': []
            }
    
    def extract_themes(self, code: str) -> List[Dict[str, Any]]:
        """Extract color schemes, fonts, and styling patterns"""
        themes = []
        
        # Extract color palettes
        colors = self._extract_colors(code)
        
        # Extract font configurations
        fonts = self._extract_fonts(code)
        
        # Extract spacing/sizing patterns
        spacing = self._extract_spacing(code)
        
        # Extract border radius patterns
        border_radius = self._extract_border_radius(code)
        
        # Extract shadow patterns
        shadows = self._extract_shadows(code)
        
        if colors or fonts or spacing:
            theme = {
                'name': 'Imported Theme',
                'colors': colors,
                'fonts': fonts,
                'spacing': spacing,
                'border_radius': border_radius,
                'shadows': shadows
            }
            themes.append(theme)
        
        return themes
    
    def _extract_colors(self, code: str) -> Dict[str, Any]:
        """Extract color values from code (only real, usable colors)"""
        colors = {
            'primary': [],
            'secondary': [],
            'background': [],
            'text': [],
            'accent': [],
            'chart_colors': []
        }
        
        # Hex colors (e.g., #3b82f6, #fff)
        hex_colors = re.findall(r'#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{3}', code)
        hex_colors = list(set(hex_colors))  # Remove duplicates
        
        # RGB/RGBA colors (e.g., rgb(59, 130, 246), rgba(59, 130, 246, 0.5))
        # But EXCLUDE CSS variables: rgb(var(--something))
        rgb_colors = re.findall(r'rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+(?:\s*,\s*[\d.]+)?\s*\)', code)
        rgb_colors = list(set(rgb_colors))
        
        # HSL colors (e.g., hsl(217, 91%, 60%))
        # But EXCLUDE CSS variables: hsl(var(--something))
        hsl_colors = re.findall(r'hsla?\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%(?:\s*,\s*[\d.]+)?\s*\)', code)
        hsl_colors = list(set(hsl_colors))
        
        # Named color patterns (looking for context)
        primary_pattern = re.findall(r'(?:primary|main)(?:Color)?["\']?\s*[:=]\s*["\']?([#\w()]+)', code, re.IGNORECASE)
        secondary_pattern = re.findall(r'(?:secondary|accent)(?:Color)?["\']?\s*[:=]\s*["\']?([#\w()]+)', code, re.IGNORECASE)
        
        # Filter out CSS variables from named patterns
        if primary_pattern:
            primary_val = primary_pattern[0]
            if not ('var(' in primary_val or 'var(--' in primary_val):
                colors['primary'] = primary_val
                
        if secondary_pattern:
            secondary_val = secondary_pattern[0]
            if not ('var(' in secondary_val or 'var(--' in secondary_val):
                colors['secondary'] = secondary_val
            
        # Chart color arrays - look for explicit color arrays
        chart_color_arrays = re.findall(r'(?:colors|chartColors|palette|COLORS)\s*[:=]\s*\[(.*?)\]', code, re.DOTALL)
        if chart_color_arrays:
            for arr in chart_color_arrays:
                # Extract hex, rgb, hsl from array
                chart_hex = re.findall(r'["\']?(#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{3})["\']?', arr)
                chart_rgb = re.findall(r'["\']?(rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+(?:\s*,\s*[\d.]+)?\s*\))["\']?', arr)
                chart_hsl = re.findall(r'["\']?(hsla?\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%(?:\s*,\s*[\d.]+)?\s*\))["\']?', arr)
                
                all_chart_colors = chart_hex + chart_rgb + chart_hsl
                # Filter out CSS variables
                all_chart_colors = [c for c in all_chart_colors if not ('var(' in c or 'var(--' in c)]
                if all_chart_colors:
                    colors['chart_colors'].extend(all_chart_colors)
        
        # If no specific chart colors found, build from all real colors
        if not colors['chart_colors']:
            all_colors = hex_colors + rgb_colors + hsl_colors
            # Filter out common non-color values and CSS variables
            all_colors = [c for c in all_colors if not ('var(' in c or 'var(--' in c)]
            # Remove duplicates and limit to reasonable number
            colors['chart_colors'] = list(dict.fromkeys(all_colors))[:12]
        
        # If still no colors, try to extract from Tailwind/utility classes and convert to hex
        if not colors['chart_colors']:
            # Extract Tailwind color patterns and convert to approximate hex values
            tw_patterns = re.findall(r'(?:bg|text|border)-(blue|red|green|yellow|purple|pink|indigo|cyan|teal|orange|gray|slate)-(\d+)', code)
            if tw_patterns:
                colors['chart_colors'] = self._convert_tailwind_to_hex(tw_patterns[:8])
        
        # Extract CSS custom property VALUES (not the var() references)
        css_var_definitions = re.findall(r'--[\w-]+:\s*(#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{3}|rgba?\([^)]+\)|hsla?\([^)]+\))', code)
        if css_var_definitions:
            # Filter to only actual color values
            css_var_definitions = [c for c in css_var_definitions if not ('var(' in c or 'var(--' in c)]
            colors['css_variables'] = list(set(css_var_definitions))[:10]
            # Use these as backup chart colors if we still don't have any
            if not colors['chart_colors'] and css_var_definitions:
                colors['chart_colors'] = css_var_definitions[:8]
        
        # Final cleanup: remove duplicates from chart_colors
        if colors['chart_colors']:
            colors['chart_colors'] = list(dict.fromkeys(colors['chart_colors']))
        
        return colors
    
    def _convert_tailwind_to_hex(self, tw_patterns: List[tuple]) -> List[str]:
        """Convert Tailwind color classes to approximate hex values"""
        # Tailwind color palette (approximate values)
        tailwind_colors = {
            'blue': {'500': '#3b82f6', '600': '#2563eb', '700': '#1d4ed8'},
            'red': {'500': '#ef4444', '600': '#dc2626', '700': '#b91c1c'},
            'green': {'500': '#10b981', '600': '#059669', '700': '#047857'},
            'yellow': {'500': '#eab308', '600': '#ca8a04', '700': '#a16207'},
            'purple': {'500': '#a855f7', '600': '#9333ea', '700': '#7e22ce'},
            'pink': {'500': '#ec4899', '600': '#db2777', '700': '#be185d'},
            'indigo': {'500': '#6366f1', '600': '#4f46e5', '700': '#4338ca'},
            'cyan': {'500': '#06b6d4', '600': '#0891b2', '700': '#0e7490'},
            'teal': {'500': '#14b8a6', '600': '#0d9488', '700': '#0f766e'},
            'orange': {'500': '#f97316', '600': '#ea580c', '700': '#c2410c'},
            'gray': {'500': '#6b7280', '600': '#4b5563', '700': '#374151'},
            'slate': {'500': '#64748b', '600': '#475569', '700': '#334155'},
        }
        
        hex_colors = []
        for color_name, shade in tw_patterns:
            if color_name in tailwind_colors and shade in tailwind_colors[color_name]:
                hex_colors.append(tailwind_colors[color_name][shade])
            elif color_name in tailwind_colors:
                # Use 500 as default
                hex_colors.append(tailwind_colors[color_name].get('500', '#3b82f6'))
        
        return hex_colors
    
    def _extract_fonts(self, code: str) -> Dict[str, str]:
        """Extract font family and size patterns"""
        fonts = {}
        
        # Font families
        font_family = re.findall(r'font(?:Family)?["\']?\s*[:=]\s*["\']([^"\']+)["\']', code)
        if font_family:
            fonts['family'] = font_family[0]
        
        # Font sizes
        font_sizes = re.findall(r'fontSize["\']?\s*[:=]\s*["\']?(\d+(?:px|rem|em)?)', code)
        if font_sizes:
            fonts['sizes'] = list(set(font_sizes))
        
        # Font weights
        font_weights = re.findall(r'font(?:Weight)?["\']?\s*[:=]\s*["\']?(\d+|bold|normal|light)', code)
        if font_weights:
            fonts['weights'] = list(set(font_weights))
        
        return fonts
    
    def _extract_spacing(self, code: str) -> Dict[str, List[str]]:
        """Extract spacing patterns (margin, padding, gap)"""
        spacing = {
            'padding': [],
            'margin': [],
            'gap': []
        }
        
        # CSS spacing values
        padding_values = re.findall(r'padding["\']?\s*[:=]\s*["\']?([0-9.]+(?:px|rem|em))', code)
        margin_values = re.findall(r'margin["\']?\s*[:=]\s*["\']?([0-9.]+(?:px|rem|em))', code)
        gap_values = re.findall(r'gap["\']?\s*[:=]\s*["\']?([0-9.]+(?:px|rem|em))', code)
        
        # Tailwind spacing classes
        tw_padding = re.findall(r'p-(\d+)|px-(\d+)|py-(\d+)', code)
        tw_margin = re.findall(r'm-(\d+)|mx-(\d+)|my-(\d+)', code)
        tw_gap = re.findall(r'gap-(\d+)', code)
        
        spacing['padding'] = list(set(padding_values))
        spacing['margin'] = list(set(margin_values))
        spacing['gap'] = list(set(gap_values))
        
        return spacing
    
    def _extract_border_radius(self, code: str) -> List[str]:
        """Extract border radius patterns"""
        radius_values = re.findall(r'border(?:Radius)?["\']?\s*[:=]\s*["\']?([0-9.]+(?:px|rem|em|%))', code)
        tw_radius = re.findall(r'rounded(?:-(\w+))?', code)
        
        return list(set(radius_values))
    
    def _extract_shadows(self, code: str) -> List[str]:
        """Extract box shadow patterns"""
        shadow_values = re.findall(r'(?:box)?Shadow["\']?\s*[:=]\s*["\']([^"\']+)["\']', code)
        tw_shadows = re.findall(r'shadow(?:-(\w+))?', code)
        
        return list(set(shadow_values))
    
    def extract_charts(self, code: str) -> List[Dict[str, Any]]:
        """Extract chart configurations and types"""
        charts = []
        
        # Common chart library imports
        chart_libraries = {
            'recharts': [
                'BarChart', 'LineChart', 'PieChart', 'AreaChart', 'ScatterChart', 'RadarChart',
                'ComposedChart', 'Treemap', 'FunnelChart', 'SankeyChart', 'RadialBarChart',
                'ResponsiveContainer', 'Line', 'Bar', 'Area', 'XAxis', 'YAxis', 'CartesianGrid',
                'Tooltip', 'Legend', 'Cell', 'LabelList'
            ],
            'victory': ['VictoryBar', 'VictoryLine', 'VictoryPie', 'VictoryArea'],
            'nivo': ['ResponsiveBar', 'ResponsiveLine', 'ResponsivePie', 'ResponsiveHeatMap', 'ResponsiveTreeMap'],
            'chart.js': ['Bar', 'Line', 'Pie', 'Doughnut', 'Radar'],
            'echarts': ['EChartsReact']
        }
        
        # Detect which library is used
        detected_library = None
        for lib, components in chart_libraries.items():
            for component in components:
                if component in code:
                    detected_library = lib
                    break
            if detected_library:
                break
        
        # Extract chart components
        for lib, components in chart_libraries.items():
            for component in components:
                # Find component usage
                pattern = rf'<{component}[^>]*>(.*?)</{component}>'
                matches = re.finditer(pattern, code, re.DOTALL)
                
                for match in matches:
                    chart_code = match.group(0)
                    chart_config = self._parse_chart_config(chart_code, component)
                    
                    if chart_config:
                        chart_config['library'] = lib
                        charts.append(chart_config)
        
        # Extract custom chart configurations
        custom_charts = self._extract_custom_charts(code)
        charts.extend(custom_charts)
        logger.info(f"📋 Custom chart patterns: {len(custom_charts)} found")
        
        # Also detect charts from imports and JSX usage
        import_charts = self._extract_charts_from_imports(code)
        charts.extend(import_charts)
        logger.info(f"📥 Import/JSX detection: {len(import_charts)} found")
        
        # Deduplicate by type
        unique_charts = []
        seen_types = set()
        for chart in charts:
            chart_type = chart.get('type', 'unknown')
            if chart_type not in seen_types:
                unique_charts.append(chart)
                seen_types.add(chart_type)
        
        logger.info(f"✅ TOTAL UNIQUE CHARTS DETECTED: {len(unique_charts)} (from {len(charts)} raw detections)")
        logger.info(f"Chart types: {list(seen_types)}")
        
        return unique_charts
    
    def _extract_charts_from_imports(self, code: str) -> List[Dict[str, Any]]:
        """Extract chart types from import statements and JSX usage"""
        charts = []
        chart_types_found = set()
        
        logger.info(f"🔍 Looking for chart patterns in code (length: {len(code)} chars)")
        
        # Chart type mappings for multiple libraries
        chart_keywords = {
            # Recharts (most common)
            'BarChart': 'bar', 'LineChart': 'line', 'PieChart': 'pie', 'AreaChart': 'area',
            'ScatterChart': 'scatter', 'RadarChart': 'radar', 'ComposedChart': 'composed',
            'Treemap': 'treemap', 'FunnelChart': 'funnel', 'SankeyChart': 'sankey',
            'RadialBarChart': 'radialbar',
            # Generic chart patterns
            'Bar': 'bar', 'Line': 'line', 'Pie': 'pie', 'Area': 'area',
            'Heatmap': 'heatmap', 'HeatMap': 'heatmap',
            'TreeMap': 'treemap',
            'Radar': 'radar',
            # Nivo
            'ResponsiveBar': 'bar', 'ResponsiveLine': 'line', 'ResponsivePie': 'pie',
            'ResponsiveHeatMap': 'heatmap', 'ResponsiveTreeMap': 'treemap',
            # Victory
            'VictoryBar': 'bar', 'VictoryLine': 'line', 'VictoryPie': 'pie',
            'VictoryArea': 'area', 'VictoryScatter': 'scatter'
        }
        
        # Method 1: Look for import statements from ANY charting library
        import_patterns = [
            r'import\s+\{([^}]+)\}\s+from\s+["\'](?:recharts|@nivo/\w+|victory|chart\.js)["\']',
            r'import\s+([A-Z]\w+)\s+from\s+["\'](?:recharts|@nivo/\w+|victory|chart\.js)',
        ]
        
        for pattern in import_patterns:
            matches = re.finditer(pattern, code, re.MULTILINE)
            for match in matches:
                imports_str = match.group(1)
                logger.info(f"Found chart import: {imports_str}")
                
                # Split by comma if it's a destructured import
                if '{' not in pattern:
                    components = [imports_str.strip()]
                else:
                    components = [comp.strip() for comp in imports_str.split(',')]
                
                for comp in components:
                    if comp in chart_keywords:
                        chart_type = chart_keywords[comp]
                        if chart_type not in chart_types_found:
                            charts.append({
                                'type': chart_type,
                                'component': comp,
                                'library': 'detected',
                                'props': {}
                            })
                            chart_types_found.add(chart_type)
                            logger.info(f"✅ Detected chart from import: {comp} -> {chart_type}")
        
        # Method 2: Look for JSX usage of chart components (even without imports)
        logger.info(f"🔎 Searching for JSX chart usage in {len(chart_keywords)} keywords...")
        jsx_found_count = 0
        for keyword, chart_type in chart_keywords.items():
            # Look for <BarChart, <ResponsiveBar, <Treemap, etc. (both self-closing and regular)
            # Patterns: <Keyword> or <Keyword  or <Keyword/> or <Keyword\n
            jsx_patterns = [
                rf'<{keyword}[\s/>]',  # <Treemap />, <Treemap>, <Treemap 
                rf'<{keyword}$',  # <Treemap at end of line
            ]
            
            for jsx_pattern in jsx_patterns:
                if re.search(jsx_pattern, code, re.MULTILINE):
                    if chart_type not in chart_types_found:
                        charts.append({
                            'type': chart_type,
                            'component': keyword,
                            'library': 'jsx-detected',
                            'props': {}
                        })
                        chart_types_found.add(chart_type)
                        jsx_found_count += 1
                        logger.info(f"✅ Detected chart from JSX: {keyword} -> {chart_type}")
                    break  # Found it, no need to check other patterns
        
        logger.info(f"📊 JSX Detection: Found {jsx_found_count} unique chart types from JSX usage")
        
        # Method 3: Look for KPI/metric cards patterns
        kpi_patterns = [
            r'(?:kpi|metric|stat|card).*(?:value|count|total|revenue|sales)',
            r'className=["\'"].*(?:kpi|metric|stat-card)',
            r'<Card.*(?:value|metric|kpi)'
        ]
        
        kpi_count = 0
        for pattern in kpi_patterns:
            matches = re.findall(pattern, code, re.IGNORECASE)
            kpi_count += len(matches)
        
        if kpi_count > 0:
            charts.append({
                'type': 'kpi',
                'component': 'KPI Card',
                'library': 'pattern-detected',
                'props': {'estimated_count': min(kpi_count // 5, 10)}
            })
            logger.info(f"✅ Detected ~{min(kpi_count // 5, 10)} KPI cards from patterns")
        
        # Method 4: Lovable/shadcn patterns - look for Card components with data
        card_patterns = [
            r'<Card[^>]*>',
            r'<CardContent[^>]*>',
            r'<CardHeader[^>]*>'
        ]
        
        card_count = 0
        for pattern in card_patterns:
            matches = re.findall(pattern, code)
            card_count += len(matches)
        
        if card_count > 3:
            logger.info(f"✅ Found {card_count} Card components (likely KPIs/metrics)")
            # Assume every 2-3 Cards is one visualization
            estimated_charts = card_count // 2
            for i in range(min(estimated_charts, 10)):
                charts.append({
                    'type': 'card',
                    'component': 'Card Component',
                    'library': 'shadcn-detected',
                    'props': {}
                })
        
        # Method 5: Look for data visualization keywords in component names
        viz_keywords = ['chart', 'graph', 'plot', 'visual', 'heatmap', 'treemap', 'radar', 'metric', 'stat']
        for keyword in viz_keywords:
            # Look for components/functions with these names
            pattern = rf'(?:function|const|export)\s+(\w*{keyword}\w*)'
            matches = re.findall(pattern, code, re.IGNORECASE)
            for match in matches:
                if match and len(match) > 3:
                    # Infer chart type from name
                    match_lower = match.lower()
                    chart_type = 'unknown'
                    if 'bar' in match_lower:
                        chart_type = 'bar'
                    elif 'line' in match_lower:
                        chart_type = 'line'
                    elif 'pie' in match_lower:
                        chart_type = 'pie'
                    elif 'heat' in match_lower:
                        chart_type = 'heatmap'
                    elif 'tree' in match_lower:
                        chart_type = 'treemap'
                    elif 'radar' in match_lower:
                        chart_type = 'radar'
                    
                    if chart_type not in chart_types_found:
                        charts.append({
                            'type': chart_type,
                            'component': match,
                            'library': 'custom-component',
                            'props': {}
                        })
                        chart_types_found.add(chart_type)
                        logger.info(f"✅ Detected custom visualization: {match} -> {chart_type}")
        
        # Method 6: Universal fallback - count ANY components (assume some are visualizations)
        if len(charts) == 0:
            logger.warning("⚠️ No charts detected by specific patterns - using universal fallback")
            
            # Count total React components
            component_count = len(self.extract_components(code))
            logger.info(f"Found {component_count} total components")
            
            # If we have components but no charts, assume 20-30% are visualizations
            if component_count > 5:
                estimated_viz_count = max(3, component_count // 4)  # At least 3, or 25% of components
                logger.info(f"Estimating {estimated_viz_count} visualizations from {component_count} components")
                
                # Add generic chart types
                generic_types = ['card', 'metric', 'table', 'chart', 'graph']
                for i, chart_type in enumerate(generic_types[:min(estimated_viz_count, 10)]):
                    charts.append({
                        'type': chart_type,
                        'component': f'Component_{i+1}',
                        'library': 'generic-fallback',
                        'props': {}
                    })
                    logger.info(f"✅ Added fallback visualization #{i+1}: {chart_type}")
        
        logger.info(f"📊 Total unique chart types found: {len(charts)}")
        return charts
    
    def _parse_chart_config(self, chart_code: str, component_name: str) -> Optional[Dict[str, Any]]:
        """Parse configuration from chart component"""
        config = {
            'type': self._normalize_chart_type(component_name),
            'component': component_name,
            'props': {}
        }
        
        # Extract common props
        data_prop = re.search(r'data=\{([^}]+)\}', chart_code)
        if data_prop:
            config['props']['data'] = data_prop.group(1)
        
        width_prop = re.search(r'width=\{?(\d+)\}?', chart_code)
        if width_prop:
            config['props']['width'] = width_prop.group(1)
        
        height_prop = re.search(r'height=\{?(\d+)\}?', chart_code)
        if height_prop:
            config['props']['height'] = height_prop.group(1)
        
        # Extract colors
        colors = re.findall(r'(?:fill|stroke|color)=["\'](#[0-9A-Fa-f]{6})["\']', chart_code)
        if colors:
            config['props']['colors'] = colors
        
        return config
    
    def _normalize_chart_type(self, component_name: str) -> str:
        """Convert component name to our chart type naming"""
        type_map = {
            'BarChart': 'bar',
            'LineChart': 'line',
            'PieChart': 'pie',
            'AreaChart': 'area',
            'ScatterChart': 'scatter',
            'RadarChart': 'radar',
            'VictoryBar': 'bar',
            'VictoryLine': 'line',
            'VictoryPie': 'pie',
            'ResponsiveBar': 'bar',
            'ResponsiveLine': 'line',
            'ResponsivePie': 'pie',
            'Bar': 'bar',
            'Line': 'line',
            'Pie': 'pie',
            'Doughnut': 'donut'
        }
        
        return type_map.get(component_name, 'unknown')
    
    def _extract_custom_charts(self, code: str) -> List[Dict[str, Any]]:
        """Extract custom chart implementations"""
        custom_charts = []
        
        # Look for chart-like patterns
        chart_patterns = [
            r'const\s+(\w+Chart)\s*=',
            r'function\s+(\w+Chart)\s*\(',
            r'export\s+(?:default\s+)?function\s+(\w+Chart)'
        ]
        
        for pattern in chart_patterns:
            matches = re.finditer(pattern, code)
            for match in matches:
                chart_name = match.group(1)
                custom_charts.append({
                    'type': 'custom',
                    'name': chart_name,
                    'component': chart_name
                })
        
        return custom_charts
    
    def extract_layouts(self, code: str) -> List[Dict[str, Any]]:
        """Extract layout patterns and create structured grid configurations"""
        layouts = []
        
        # Analyze the overall dashboard structure
        dashboard_structure = self._analyze_dashboard_structure(code)
        
        # Create structured layout based on detected patterns
        if dashboard_structure['has_kpi_section'] and dashboard_structure['has_main_charts']:
            # KPI-focused layout
            layouts.append({
                'type': 'kpi-dashboard',
                'layout_type': 'kpi-focused',
                'num_rows': 12,
                'num_cols': 12,
                'grid_config': {
                    'kpi_row': {
                        'y': 0,
                        'h': 2,
                        'cols': dashboard_structure['kpi_count'] or 4
                    },
                    'main_chart': {
                        'y': 2,
                        'h': 6,
                        'w': 12
                    },
                    'side_charts': {
                        'y': 8,
                        'h': 4,
                        'w': 6
                    }
                },
                'detected_features': dashboard_structure
            })
        
        # Detect sidebar + content layout (common in Lovable dashboards)
        if dashboard_structure['has_sidebar']:
            layouts.append({
                'type': 'sidebar-layout',
                'layout_type': 'sidebar',
                'num_rows': 12,
                'num_cols': 12,
                'grid_config': {
                    'sidebar': {
                        'width': dashboard_structure['sidebar_width'] or 'w-64',
                        'position': dashboard_structure['sidebar_position'] or 'left',
                        'fixed': dashboard_structure['sidebar_fixed']
                    },
                    'main_content': {
                        'margin_left': dashboard_structure['content_margin'] or 'ml-64',
                        'padding': dashboard_structure['content_padding'] or 'p-6'
                    },
                    'content_grid': {
                        'kpi_cols': dashboard_structure['kpi_grid_cols'] or 4,
                        'chart_cols': dashboard_structure['chart_grid_cols'] or 2
                    }
                },
                'detected_features': dashboard_structure
            })
        
        # Detect comparison layout (side-by-side charts)
        if dashboard_structure['has_side_by_side_charts']:
            layouts.append({
                'type': 'comparison-layout',
                'layout_type': 'comparison',
                'num_rows': 12,
                'num_cols': 12,
                'grid_config': {
                    'kpi_row': {
                        'y': 0,
                        'h': 2,
                        'cols': 3
                    },
                    'charts': {
                        'y': 2,
                        'h': 5,
                        'w': 6,
                        'cols': 2
                    }
                },
                'detected_features': dashboard_structure
            })
        
        # Fallback: Generic grid layouts
        grid_layouts = self._extract_grid_layouts(code)
        layouts.extend(grid_layouts)
        
        # Fallback: Flex layouts
        flex_layouts = self._extract_flex_layouts(code)
        layouts.extend(flex_layouts)
        
        return layouts
    
    def _analyze_dashboard_structure(self, code: str) -> Dict[str, Any]:
        """Analyze dashboard structure to detect common patterns"""
        structure = {
            'has_kpi_section': False,
            'kpi_count': 0,
            'has_main_charts': False,
            'has_sidebar': False,
            'sidebar_width': None,
            'sidebar_position': 'left',
            'sidebar_fixed': False,
            'content_margin': None,
            'content_padding': None,
            'kpi_grid_cols': None,
            'chart_grid_cols': None,
            'has_side_by_side_charts': False
        }
        
        # Detect KPI/metric cards
        kpi_patterns = [
            r'<Card[^>]*>.*?(?:total|revenue|sales|profit|users|count|metric|kpi)',
            r'className="[^"]*(?:stat|metric|kpi|card)[^"]*"',
            r'<div[^>]*>.*?<div[^>]*>\$?\d+[KMB]?',  # Number display pattern
        ]
        kpi_matches = sum(len(re.findall(pattern, code, re.IGNORECASE | re.DOTALL)) for pattern in kpi_patterns)
        if kpi_matches >= 3:
            structure['has_kpi_section'] = True
            structure['kpi_count'] = min(kpi_matches, 6)  # Cap at 6
        
        # Detect KPI grid columns
        kpi_grid_pattern = re.search(r'(?:Card|metric|kpi|stat).*?grid-cols-(\d+)', code, re.IGNORECASE | re.DOTALL)
        if kpi_grid_pattern:
            structure['kpi_grid_cols'] = int(kpi_grid_pattern.group(1))
        
        # Detect main charts
        chart_components = ['BarChart', 'LineChart', 'AreaChart', 'PieChart', 'ScatterChart', 'Chart']
        chart_count = sum(code.count(comp) for comp in chart_components)
        if chart_count >= 2:
            structure['has_main_charts'] = True
        
        # Detect chart grid columns
        chart_grid_pattern = re.search(r'(?:Chart|chart|graph).*?grid-cols-(\d+)', code, re.IGNORECASE | re.DOTALL)
        if chart_grid_pattern:
            structure['chart_grid_cols'] = int(chart_grid_pattern.group(1))
        
        # Detect sidebar
        sidebar_patterns = [
            r'<(?:aside|nav)[^>]*className="[^"]*(?:sidebar|side-nav)',
            r'className="[^"]*(?:fixed|absolute)[^"]*(?:left|right)',
            r'w-(?:64|72|80|56|48)',  # Common Tailwind sidebar widths
        ]
        for pattern in sidebar_patterns:
            if re.search(pattern, code, re.IGNORECASE):
                structure['has_sidebar'] = True
                break
        
        if structure['has_sidebar']:
            # Extract sidebar width
            width_match = re.search(r'w-(64|72|80|56|48)', code)
            if width_match:
                structure['sidebar_width'] = f'w-{width_match.group(1)}'
            
            # Check if sidebar is fixed
            if re.search(r'fixed.*(?:left|right)', code):
                structure['sidebar_fixed'] = True
            
            # Extract content margin (usually matches sidebar width)
            margin_match = re.search(r'ml-(64|72|80|56|48)', code)
            if margin_match:
                structure['content_margin'] = f'ml-{margin_match.group(1)}'
            
            # Extract content padding
            padding_match = re.search(r'<main[^>]*className="[^"]*p-(\d+)', code)
            if padding_match:
                structure['content_padding'] = f'p-{padding_match.group(1)}'
        
        # Detect side-by-side charts (comparison layout)
        grid_2_cols = code.count('grid-cols-2')
        if grid_2_cols >= 2:  # Multiple 2-column grids suggest comparison
            structure['has_side_by_side_charts'] = True
        
        return structure
    
    def _extract_grid_layouts(self, code: str) -> List[Dict[str, Any]]:
        """Extract CSS Grid patterns"""
        layouts = []
        
        # CSS Grid patterns
        grid_template_cols = re.findall(r'grid-template-columns:\s*([^;}"]+)', code)
        grid_template_rows = re.findall(r'grid-template-rows:\s*([^;}"]+)', code)
        
        # Tailwind Grid classes
        tw_grid_cols = re.findall(r'grid-cols-(\d+)', code)
        tw_grid_rows = re.findall(r'grid-rows-(\d+)', code)
        tw_gap = re.findall(r'gap-(\d+)', code)
        
        if grid_template_cols or tw_grid_cols:
            layouts.append({
                'type': 'grid',
                'columns': grid_template_cols or list(set(tw_grid_cols)),
                'rows': grid_template_rows or list(set(tw_grid_rows)),
                'gap': list(set(tw_gap)) if tw_gap else[]
            })
        
        # Detect sidebar layouts
        sidebar_patterns = [
            r'sidebar', r'nav-?side', r'side-?nav',
            r'w-64', r'w-72', r'w-80',  # Common sidebar widths in Tailwind
            r'fixed\s+left', r'absolute\s+left'
        ]
        
        has_sidebar = any(re.search(pattern, code, re.IGNORECASE) for pattern in sidebar_patterns)
        if has_sidebar:
            layouts.append({
                'type': 'sidebar',
                'position': 'left',  # Most common
                'detected_patterns': [p for p in sidebar_patterns if re.search(p, code, re.IGNORECASE)]
            })
        
        # Detect card/panel layouts
        card_classes = re.findall(r'(?:className|class)=["\'[^"\']*(?:card|panel|container)[^"\']*["\']', code)
        if len(card_classes) > 3:  # Multiple cards suggest card-based layout
            layouts.append({
                'type': 'cards',
                'count': len(card_classes),
                'pattern': 'multi-card-layout'
            })
        
        return layouts
    
    def _extract_flex_layouts(self, code: str) -> List[Dict[str, Any]]:
        """Extract Flexbox patterns"""
        layouts = []
        
        # Flexbox patterns
        flex_direction = re.findall(r'flex-direction:\s*(\w+)', code)
        justify_content = re.findall(r'justify-content:\s*([\w-]+)', code)
        align_items = re.findall(r'align-items:\s*([\w-]+)', code)
        
        # Tailwind Flex classes
        tw_flex_direction = re.findall(r'flex-(row|col)', code)
        tw_justify = re.findall(r'justify-(\w+)', code)
        tw_items = re.findall(r'items-(\w+)', code)
        
        if flex_direction or tw_flex_direction:
            layouts.append({
                'type': 'flex',
                'direction': flex_direction or tw_flex_direction,
                'justify': justify_content or tw_justify,
                'align': align_items or tw_items
            })
        
        return layouts
    
    def _extract_react_grid_layout(self, code: str) -> List[Dict[str, Any]]:
        """Extract react-grid-layout configurations"""
        layouts = []
        
        # Look for GridLayout component
        if 'react-grid-layout' in code or 'GridLayout' in code:
            # Extract layout config
            layout_config = re.search(r'layout\s*=\s*(\[.*?\])', code, re.DOTALL)
            if layout_config:
                try:
                    # Try to parse the layout config
                    config_str = layout_config.group(1)
                    # This is a simplified extraction - full JSON parsing would be better
                    layouts.append({
                        'type': 'react-grid-layout',
                        'config': config_str[:500]  # Truncate for safety
                    })
                except:
                    pass
        
        return layouts
    
    def extract_components(self, code: str) -> List[str]:
        """Extract component names from code"""
        components = []
        
        # Function components
        func_components = re.findall(r'(?:export\s+)?(?:default\s+)?function\s+([A-Z]\w+)', code)
        components.extend(func_components)
        
        # Arrow function components
        arrow_components = re.findall(r'(?:export\s+)?const\s+([A-Z]\w+)\s*=\s*\(', code)
        components.extend(arrow_components)
        
        # Class components
        class_components = re.findall(r'class\s+([A-Z]\w+)\s+extends\s+(?:React\.)?Component', code)
        components.extend(class_components)
        
        return list(set(components))


def analyze_dashboard_code(code: str, filename: str = "unknown") -> Dict[str, Any]:
    """
    Convenience function to analyze dashboard code
    """
    analyzer = DashboardCodeAnalyzer()
    return analyzer.analyze(code, filename)

