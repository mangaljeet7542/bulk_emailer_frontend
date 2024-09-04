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
  Modal,
  Tooltip,
  OverlayTrigger,
} from "react-bootstrap";
import { FiSettings } from "react-icons/fi";
import Papa from "papaparse";
import axios from "axios";
import "./BulkEmailer.css";
import img from "./img.png";

const BulkEmailer = () => {
  const [csvData, setCsvData] = useState([]);
  const [emailBody, setEmailBody] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [progress, setProgress] = useState(0);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [alert, setAlert] = useState("");
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showInstructionsModal, setShowInstructionsModal] = useState(false);
  const [appEmail, setAppEmail] = useState("");
  const [appPassword, setAppPassword] = useState("");

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!(file && file.name)) {
      return null;
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
      setError("Please provide CSV data.");
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
          appEmail,
          appPassword,
        });
        setProgress(Math.round(((i + 1) / totalEmails) * 100));
      }
    } catch (error) {
      console.error("Error sending emails:", error);
    } finally {
      setSending(false);
    }
  };

  const handleConfigSave = () => {
    if (appEmail && appPassword) {
      setShowConfigModal(false);
    } else {
      setAlert("Both App Email and App Password are required.");
    }
  };

  return (
    <Container className="mt-5">
      <Row className="justify-content-md-center">
        <Col md={8}>
          <Card className="shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-4">
                {/* <h2 className="text-center">Bulk Emailer</h2> */}
                <OverlayTrigger
                  placement="bottom"
                  overlay={
                    <Tooltip id="settings-tooltip">
                      Set up your configuration for bulk emailing. We do not
                      store any information in the database; it's real-time data
                      that will be lost when you refresh the page.
                    </Tooltip>
                  }
                >
                  <Button
                    variant="link"
                    onClick={() => setShowConfigModal(true)}
                    className="p-0"
                  >
                    <FiSettings size={24} />
                  </Button>
                </OverlayTrigger>
                <Button
                  variant="danger"
                  className="mb-3"
                  onClick={() => setShowInstructionsModal(true)}
                >
                  *You Have to Read These Instructions Before Using this
                  application.
                </Button>
              </div>

              <h2 className="text-center">Bulk Emailer</h2>

              <Form>
                {error && <Alert variant="danger">{error}</Alert>}
                {alert && <Alert variant="warning">{alert}</Alert>}

                <Form.Group controlId="formFile" className="mb-4">
                  <Form.Label>Upload CSV File</Form.Label>
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
                  disabled={sending || !appEmail || !appPassword}
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

      <Modal show={showConfigModal} onHide={() => setShowConfigModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>App Configuration</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group controlId="formAppEmail">
              <Form.Label>App Email</Form.Label>
              <Form.Control
                type="email"
                value={appEmail}
                onChange={(e) => setAppEmail(e.target.value)}
                placeholder="Enter app email"
              />
            </Form.Group>

            <Form.Group controlId="formAppPassword" className="mt-3">
              <Form.Label>App Password</Form.Label>
              <Form.Control
                type="password"
                value={appPassword}
                onChange={(e) => setAppPassword(e.target.value)}
                placeholder="Enter app password"
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowConfigModal(false)}>
            Close
          </Button>
          <Button variant="primary" onClick={handleConfigSave}>
            Save Config
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal
        show={showInstructionsModal}
        onHide={() => setShowInstructionsModal(false)}
      >
        <Modal.Header closeButton>
          <Modal.Title>Instructions</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <ol>
            <li style={{ color: "red" }}>
              You have to set up your app config. Simply click on the settings
              icon to set it up. This configuration will not be stored in the
              database; we manage it in real-time. When you refresh the page, it
              will be automatically cleared.
            </li>
            <br />
            <li style={{ color: "red" }}>
              How can you get the app email and app password? Watch this video:{" "}
              <br />
              <a
                href="https://youtu.be/MkLX85XU5rU?si=6OySCHpmQNjo4kVK"
                target="_blank"
                rel="noopener noreferrer"
              >
                https://youtu.be/MkLX85XU5rU?si=6OySCHpmQNjo4kVK
              </a>
            </li>
            <br />
            <li style={{ color: "red" }}>
              Here is the required CSV format. You need to scrape all data
              following this format.
              <img style={{ height: "100%", width: "100%" }} src={img}></img>
            </li>
            <br />
            <li style={{ color: "red" }}>
              You must first upload the CSV; after that, you can create the
              subject.
            </li>
            <br />
            <li style={{ color: "red" }}>
              In the body, you can dynamically insert the CSV name using the
              format [name]. For example:
              <pre style={{ color: "black" }}>
                Hi [name],
                <br />I am reaching out to you to offer my product. If you're
                interested, please check this out.
              </pre>
              The placeholder [name] will be replaced with each name from the
              CSV.
            </li>
          </ol>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowInstructionsModal(false)}
          >
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default BulkEmailer;
