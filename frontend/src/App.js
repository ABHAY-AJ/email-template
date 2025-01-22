import React, { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);
  const [layout, setLayout] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [footer, setFooter] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  useEffect(() => {
    axios.get("http://localhost:5000/getAllEmailTemplates").then((response) => {
      setTemplates(response.data.templates);
    });
  }, []);

  useEffect(() => {
    axios.get("http://localhost:5000/getEmailLayout").then((response) => {
      setLayout(response.data.layout);
    });
  }, []);

  const handleUpdateTemplate = async () => {
    if (!selectedTemplateId) {
      alert("No template selected for update.");
      return;
    }
    const emailConfig = { title, content, footer, imageUrl };
    await axios.put(
      `http://localhost:5000/updateEmailTemplate/${selectedTemplateId}`,
      emailConfig
    );
    alert("Template updated successfully!");
    setSelectedTemplateId(null); // Clear selection after update
    const updatedTemplates = await axios.get("http://localhost:5000/getAllEmailTemplates");
    setTemplates(updatedTemplates.data.templates);
  };

  const handleDeleteTemplate = async (id) => {
    if (window.confirm("Are you sure you want to delete this template?")) {
      await axios.delete(`http://localhost:5000/deleteEmailTemplate/${id}`);
      alert("Template deleted successfully!");
      const updatedTemplates = await axios.get("http://localhost:5000/getAllEmailTemplates");
      setTemplates(updatedTemplates.data.templates);
    }
  };

  const handleImageUpload = async (e) => {
    const formData = new FormData();
    formData.append("image", e.target.files[0]); // Ensure a file is selected
    try {
      const response = await axios.post(
        "http://localhost:5000/uploadImage",
        formData
      );
      setImageUrl(`${response.data.imageUrl}`);
    } catch (error) {
      console.error("Error uploading image: ", error);
    }
  };
  

  const renderTemplate = () => {
    return layout
      .replace("{{title}}", title || "Your Title Here")
      .replace("{{content}}", content || "Your Content Here")
      .replace("{{footer}}", footer || "Your Footer Here")
      .replace("{{imageUrl}}", imageUrl || "");
  };

  const handleSaveTemplate = async () => {
    const emailConfig = { title, content, footer, imageUrl };
    await axios.post("http://localhost:5000/uploadEmailConfig", emailConfig);
    alert("Email template saved successfully!");
    const response = await axios.get("http://localhost:5000/getAllEmailTemplates");
    setTemplates(response.data.templates);
  };

  const handleDownload = async (emailConfig) => {
    const response = await axios.post(
      "http://localhost:5000/renderAndDownloadTemplate",
      emailConfig,
      {
        responseType: "blob",
      }
    );
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "email-template.html");
    document.body.appendChild(link);
    link.click();
  };

  const handleSelectTemplate = async (id) => {
    const response = await axios.get(`http://localhost:5000/getEmailTemplate/${id}`);
    const template = response.data.template;
    setSelectedTemplateId(id);
    setTitle(template.title);
    setContent(template.content);
    setFooter(template.footer);
    setImageUrl(template.imageUrl);
  };

  return (
    <div className="App">
      <h1>Email Builder</h1>

      {/* Add New Template Form */}
      <div className="editor">
        <button
          onClick={() => {
            setSelectedTemplateId(null);
            setTitle("");
            setContent("");
            setFooter("");
            setImageUrl(""); // Reset other fields
          }}
        >
          Add New Template
        </button>
        {selectedTemplateId === null && (
          <div>
            <h2>New Template</h2>
            <div
              className="preview"
              dangerouslySetInnerHTML={{ __html: renderTemplate() }}
            ></div>
            <input
              type="text"
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <textarea
              placeholder="Content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            ></textarea>
            <input
              type="text"
              placeholder="Footer"
              value={footer}
              onChange={(e) => setFooter(e.target.value)}
            />
            <input type="file" onChange={handleImageUpload} />
            {imageUrl && <img src={imageUrl} alt="Uploaded" style={{ width: "100px" }} />}
            <button onClick={handleSaveTemplate}>Save Template</button>
          </div>
        )}
      </div>

      {/* Saved Templates List */}
      <div>
        <h2>Saved Templates</h2>
        <div className="template-grid">
          {templates.map((template) => (
            <div className="template-card" key={template._id}>
              <h3>{template.title || "Untitled Template"}</h3>
              <p>{template.content || "No content available."}</p>
              <footer>{template.footer || "No footer available."}</footer>
              {template.imageUrl && (
                <img src={template.imageUrl} alt="Template" style={{ width: "100%" }} />
              )}
              <button onClick={() => handleSelectTemplate(template._id)}>Edit</button>
              <button onClick={() => handleDeleteTemplate(template._id)}>Delete</button>
              <button onClick={() => handleDownload(template)}>Download</button>

              {/* Edit Form for the Selected Template */}
              {selectedTemplateId === template._id && (
                <div className="editor">
                  <h3>Edit Template</h3>
                  <input
                    type="text"
                    placeholder="Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                  <textarea
                    placeholder="Content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                  ></textarea>
                  <input
                    type="text"
                    placeholder="Footer"
                    value={footer}
                    onChange={(e) => setFooter(e.target.value)}
                  />
                  <input type="file" onChange={handleImageUpload} />
                  {imageUrl && <img src={imageUrl} alt="Uploaded" style={{ width: "100px" }} />}
                  <button onClick={handleUpdateTemplate}>Update Template</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
