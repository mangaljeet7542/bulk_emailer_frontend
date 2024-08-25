import React, { useState } from "react";
import {
  Container,
  Row,
  Col,
  Form,
  Button,
  ProgressBar,
  Card,
  Alert,
} from "react-bootstrap";
import Papa from "papaparse";
import axios from "axios";
import "./BulkEmailer.css";

const BulkEmailer = () => {
  const [csvData, setCsvData] = useState([]);
  const [emailBody, setEmailBody] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [progress, setProgress] = useState(0);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [alert, setAlert] = useState("");

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if(!(file && file.name)){
        return null
    }
    const fileExtension = file.name.split(".").pop().toLowerCase();
    const allowedExtensions = ["csv", "xlsx", "xls"];

    if (!allowedExtensions.includes(fileExtension)) {
      setError("Invalid file type. Please upload a CSV, XLSX, or XLS file.");
      return;
    }

    setError(""); // Clear any previous errors

    // Process CSV file (for xlsx/xls, additional libraries would be needed)
    if (fileExtension === "csv") {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (result) => {
          setCsvData(result.data);
        },
      });
    } else {
      // Placeholder for processing XLSX/XLS files if necessary
      console.warn("XLSX/XLS processing not implemented yet.");
    }
  };

  const handleSendEmails = async () => {
    if (csvData.length === 0) {
      setError("Please provide csv data:)");
      return;
    }
    if (!emailSubject.trim() || !emailBody.trim()) {
      setAlert("Subject and Email Body cannot be empty.");
      return;
    }

    setSending(true);
    setAlert(""); // Clear any previous alerts

    try {
      const totalEmails = csvData.length;
      for (let i = 0; i < totalEmails; i++) {
        const { email, cc, bcc, name } = csvData[i];
        const body = emailBody.replaceAll("[name]", name);
        await axios.post("http://localhost:1000/api/send-email", {
          to: email,
          cc: cc ? cc.split(",") : [],
          bcc: bcc ? bcc.split(",") : [],
          subject: `${emailSubject}`,
          text: body,
        });
        setProgress(Math.round(((i + 1) / totalEmails) * 100));
      }
    } catch (error) {
      console.error("Error sending emails:", error);
    } finally {
      setSending(false);
    }
  };

  return (
    <Container className="mt-5">
      <Row className="justify-content-md-center">
        <Col md={8}>
          <Card className="shadow-sm">
            <Card.Body>
              <h2 className="text-center mb-4">Bulk Emailer</h2>
              <Form>
                {error && <Alert variant="danger">{error}</Alert>}
                {alert && <Alert variant="warning">{alert}</Alert>}

                <Form.Group controlId="formFile" className="mb-4">
                  {/* <Form.Label>Import CSV, XLSX, or XLS</Form.Label> */}
                  <Form.Control
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileUpload}
                    className="custom-file-input"
                  />
                </Form.Group>

                <Form.Group controlId="formSubject" className="mb-4">
                  <Form.Label>Email Subject</Form.Label>
                  <Form.Control
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    className="custom-input"
                    placeholder="Enter email subject"
                  />
                </Form.Group>

                <Form.Group controlId="formBody" className="mb-4">
                  <Form.Label
                    style={{
                      fontWeight: "bold",
                      color: "#ff0000",
                      fontSize: "14px",
                    }}
                  >
                    {
                      "Use [name] for dynamic value, like Hi [name] -> Hi Shivam"
                    }
                  </Form.Label>
                  <Form.Label>Email Body</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={5}
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    className="custom-textarea"
                    placeholder="Enter email body"
                  />
                </Form.Group>

                <Button
                  variant="primary"
                  onClick={handleSendEmails}
                  disabled={sending}
                  className="w-100"
                >
                  {sending ? "Sending Emails..." : "Send Emails"}
                </Button>

                {progress > 0 && (
                  <ProgressBar
                    animated
                    now={progress}
                    label={`${progress}%`}
                    className="mt-3 custom-progress-bar"
                  />
                )}
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default BulkEmailer;
