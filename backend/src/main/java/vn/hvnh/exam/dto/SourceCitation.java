package vn.hvnh.exam.dto;

public class SourceCitation {
    private String documentTitle;
    private Integer pageNumber;
    private String quotedText;

    public SourceCitation() {}

    public SourceCitation(String documentTitle, Integer pageNumber, String quotedText) {
        this.documentTitle = documentTitle;
        this.pageNumber = pageNumber;
        this.quotedText = quotedText;
    }

    public String getDocumentTitle() { return documentTitle; }
    public void setDocumentTitle(String documentTitle) { this.documentTitle = documentTitle; }

    public Integer getPageNumber() { return pageNumber; }
    public void setPageNumber(Integer pageNumber) { this.pageNumber = pageNumber; }

    public String getQuotedText() { return quotedText; }
    public void setQuotedText(String quotedText) { this.quotedText = quotedText; }

    public static SourceCitationBuilder builder() {
        return new SourceCitationBuilder();
    }

    public static class SourceCitationBuilder {
        private String documentTitle;
        private Integer pageNumber;
        private String quotedText;

        SourceCitationBuilder() {}

        public SourceCitationBuilder documentTitle(String documentTitle) {
            this.documentTitle = documentTitle;
            return this;
        }

        public SourceCitationBuilder pageNumber(Integer pageNumber) {
            this.pageNumber = pageNumber;
            return this;
        }

        public SourceCitationBuilder quotedText(String quotedText) {
            this.quotedText = quotedText;
            return this;
        }

        public SourceCitation build() {
            return new SourceCitation(documentTitle, pageNumber, quotedText);
        }
    }
}