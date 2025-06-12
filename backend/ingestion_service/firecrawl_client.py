"""
Firecrawl Client for SuperPage Ingestion Service

This module provides a Python client for interacting with the Firecrawl API
to extract structured data, scrape content, and crawl websites.
"""

import os
import time
from typing import Dict, List, Optional, Any
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry


class FirecrawlError(Exception):
    """Base exception for Firecrawl API errors"""
    pass


class FirecrawlAuthError(FirecrawlError):
    """Raised when API authentication fails"""
    pass


class FirecrawlRateLimitError(FirecrawlError):
    """Raised when API rate limit is exceeded"""
    pass


class FirecrawlTimeoutError(FirecrawlError):
    """Raised when API request times out"""
    pass


class FirecrawlClient:
    """
    Client for interacting with Firecrawl API
    
    This client provides methods to extract structured data, scrape content,
    and crawl websites using the Firecrawl service.
    
    Example:
        >>> client = FirecrawlClient()
        >>> schema = {"title": "string", "price": "number"}
        >>> result = client.extract("https://example.com", schema)
        >>> print(result["data"]["title"])
    """
    
    def __init__(self, api_key: Optional[str] = None, base_url: str = "https://api.firecrawl.dev/v1"):
        """
        Initialize Firecrawl client
        
        Args:
            api_key: Firecrawl API key. If None, reads from FIRECRAWL_API_KEY env var
            base_url: Base URL for Firecrawl API
            
        Raises:
            FirecrawlAuthError: If no API key is provided
        """
        self.api_key = api_key or os.getenv("FIRECRAWL_API_KEY")
        if not self.api_key:
            raise FirecrawlAuthError("Firecrawl API key is required. Set FIRECRAWL_API_KEY environment variable.")
        
        self.base_url = base_url.rstrip("/")
        
        # Configure session with retry strategy
        self.session = requests.Session()
        retry_strategy = Retry(
            total=3,
            backoff_factor=1,
            status_forcelist=[429, 500, 502, 503, 504],
        )
        adapter = HTTPAdapter(max_retries=retry_strategy)
        self.session.mount("http://", adapter)
        self.session.mount("https://", adapter)
        
        # Set default headers
        self.session.headers.update({
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "User-Agent": "SuperPage-IngestionService/1.0.0"
        })
    
    def _make_request(self, method: str, endpoint: str, **kwargs) -> Dict[str, Any]:
        """
        Make HTTP request to Firecrawl API with error handling
        
        Args:
            method: HTTP method (GET, POST, etc.)
            endpoint: API endpoint
            **kwargs: Additional arguments for requests
            
        Returns:
            JSON response as dictionary
            
        Raises:
            FirecrawlAuthError: For 401/403 errors
            FirecrawlRateLimitError: For 429 errors
            FirecrawlTimeoutError: For timeout errors
            FirecrawlError: For other API errors
        """
        url = f"{self.base_url}/{endpoint.lstrip('/')}"
        
        try:
            response = self.session.request(method, url, timeout=30, **kwargs)
            
            # Handle specific error codes
            if response.status_code == 401:
                raise FirecrawlAuthError("Invalid API key or unauthorized access")
            elif response.status_code == 403:
                raise FirecrawlAuthError("Access forbidden - check API key permissions")
            elif response.status_code == 429:
                raise FirecrawlRateLimitError("Rate limit exceeded - please wait before retrying")
            elif response.status_code >= 400:
                error_msg = f"API request failed with status {response.status_code}"
                try:
                    error_data = response.json()
                    if "error" in error_data:
                        error_msg += f": {error_data['error']}"
                except:
                    error_msg += f": {response.text}"
                raise FirecrawlError(error_msg)
            
            return response.json()
            
        except requests.exceptions.Timeout:
            raise FirecrawlTimeoutError("Request timed out")
        except requests.exceptions.RequestException as e:
            raise FirecrawlError(f"Request failed: {str(e)}")
    
    def extract(self, url: str, schema: Dict[str, Any]) -> Dict[str, Any]:
        """
        Extract structured data from a URL using the provided schema

        Args:
            url: URL to extract data from
            schema: Dictionary defining the structure of data to extract
                   Format: {"field_name": "data_type", ...}

        Returns:
            Dictionary containing extracted data and metadata

        Example:
            >>> schema = {
            ...     "title": "string",
            ...     "price": "number",
            ...     "description": "string"
            ... }
            >>> result = client.extract("https://shop.example.com/product", schema)
            >>> print(result["data"]["json"]["title"])
            "Amazing Product"

        Raises:
            FirecrawlError: If extraction fails
        """
        payload = {
            "url": url,
            "formats": ["json"],
            "jsonOptions": {
                "schema": schema
            },
            "onlyMainContent": True,
            "timeout": 30000
        }

        return self._make_request("POST", "/scrape", json=payload)
    
    def scrape(self, url: str, format: str = "markdown") -> str:
        """
        Scrape content from a URL in the specified format
        
        Args:
            url: URL to scrape
            format: Output format ("markdown", "html", "text")
            
        Returns:
            Scraped content as string
            
        Example:
            >>> content = client.scrape("https://example.com", "markdown")
            >>> print(content[:100])
            "# Example Website\n\nThis is the main content..."
        
        Raises:
            FirecrawlError: If scraping fails
        """
        payload = {
            "url": url,
            "formats": [format],
            "onlyMainContent": True,
            "timeout": 30000
        }

        response = self._make_request("POST", "/scrape", json=payload)
        
        # Extract content based on format
        if format == "markdown":
            return response.get("data", {}).get("markdown", "")
        elif format == "html":
            return response.get("data", {}).get("html", "")
        elif format == "text":
            return response.get("data", {}).get("markdown", "")  # v1 doesn't have separate text format
        else:
            # Return raw response for unknown formats
            return str(response.get("data", {}))
    
    def crawl(self, domain: str, max_depth: int = 2) -> List[Dict[str, Any]]:
        """
        Crawl a domain and return structured data from multiple pages
        
        Args:
            domain: Domain to crawl (e.g., "example.com")
            max_depth: Maximum crawl depth (default: 2)
            
        Returns:
            List of dictionaries containing data from each crawled page
            
        Example:
            >>> pages = client.crawl("blog.example.com", max_depth=1)
            >>> for page in pages:
            ...     print(f"Title: {page['title']}, URL: {page['url']}")
        
        Raises:
            FirecrawlError: If crawling fails
        """
        # Ensure domain has protocol
        if not domain.startswith(("http://", "https://")):
            domain = f"https://{domain}"
        
        payload = {
            "url": domain,
            "crawlerOptions": {
                "maxDepth": max_depth,
                "limit": 50,  # Reasonable limit to avoid excessive crawling
                "allowBackwardCrawling": False,
                "allowExternalContentLinks": False
            },
            "pageOptions": {
                "onlyMainContent": True
            }
        }
        
        # Start crawl job
        crawl_response = self._make_request("POST", "/crawl", json=payload)
        job_id = crawl_response.get("jobId")
        
        if not job_id:
            raise FirecrawlError("Failed to start crawl job")
        
        # Poll for completion
        max_wait_time = 300  # 5 minutes
        poll_interval = 5    # 5 seconds
        elapsed_time = 0
        
        while elapsed_time < max_wait_time:
            status_response = self._make_request("GET", f"/crawl/status/{job_id}")
            status = status_response.get("status")
            
            if status == "completed":
                return status_response.get("data", [])
            elif status == "failed":
                error_msg = status_response.get("error", "Crawl job failed")
                raise FirecrawlError(f"Crawl failed: {error_msg}")
            
            # Wait before next poll
            time.sleep(poll_interval)
            elapsed_time += poll_interval
        
        raise FirecrawlTimeoutError(f"Crawl job timed out after {max_wait_time} seconds")
    
    def get_credits(self) -> Dict[str, Any]:
        """
        Get current API credit usage and limits
        
        Returns:
            Dictionary containing credit information
            
        Example:
            >>> credits = client.get_credits()
            >>> print(f"Remaining: {credits['credits_remaining']}")
        """
        return self._make_request("GET", "/credits")
    
    def close(self):
        """Close the HTTP session"""
        if hasattr(self, 'session'):
            self.session.close()
    
    def __enter__(self):
        """Context manager entry"""
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit"""
        self.close()


# Convenience function for quick usage
def extract_data(url: str, schema: Dict[str, Any], api_key: Optional[str] = None) -> Dict[str, Any]:
    """
    Convenience function to extract data from a URL
    
    Args:
        url: URL to extract data from
        schema: Extraction schema
        api_key: Optional API key (uses env var if not provided)
        
    Returns:
        Extracted data
        
    Example:
        >>> schema = {"title": "string", "price": "number"}
        >>> data = extract_data("https://example.com", schema)
    """
    with FirecrawlClient(api_key) as client:
        return client.extract(url, schema)
