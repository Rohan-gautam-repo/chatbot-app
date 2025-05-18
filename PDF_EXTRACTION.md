# PDF Text Extraction in Chatbot App

## Overview

The application uses `pdfplumber` to extract text from PDF files. This method works well for standard PDFs that contain embedded text. 

Note: The application no longer supports OCR-based extraction for scanned or image-based PDFs.

## Using pdfplumber

The application uses `pdfplumber` for PDF text extraction, which has several advantages:

- **No external dependencies**: Works without additional system installations
- **Fast and efficient**: Direct text extraction is quick and reliable
- **Structure preservation**: Better maintains formatting and layout
- **Table detection**: Better handling of tabular data
- **Already installed**: Included in the application requirements

## Limitations

When using only `pdfplumber`:

- **Scanned PDFs**: Text cannot be extracted from scanned or image-based PDFs
- **Heavy graphics**: PDFs that primarily consist of images with text embedded in the images will not have their text extracted
- **Protected PDFs**: Encrypted or password-protected PDFs may not be processed correctly

For these types of documents, users may need to use external OCR software to convert them to text-based PDFs before uploading.

## Note on OCR

The previous version of the application included OCR capabilities for scanned documents using `pdf2image` and `pytesseract`. This functionality has been removed to simplify the application and reduce dependencies.

## Usage Notes

- The application attempts to extract text from PDFs using `pdfplumber`
- If no text is found (which happens with scanned documents), a message will indicate that the PDF doesn't contain extractable text
- For best results, use PDFs with embedded text rather than scanned documents

If users frequently need to process scanned or image-based PDFs, consider adding OCR capabilities in the future or recommending users pre-process their documents with OCR software.
