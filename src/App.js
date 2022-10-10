import { useState, useEffect, useRef, useCallback } from 'react';
import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';
import NavDropdown from 'react-bootstrap/NavDropdown';
import Container from 'react-bootstrap/Container';
import Stack from 'react-bootstrap/Stack';

function App() {
  const [versions, setVersions] = useState();
  const [version, setVersion] = useState();
  const [apis, setApis] = useState();
  const [api, setApi] = useState({});
  const iframeRef = useRef();

  useEffect(() => {
    const resizeIframe = () => {
      if (iframeRef.current) {
        const xOffset = iframeRef.current.getBoundingClientRect().x;
        const width = `${document.body.clientWidth - xOffset}px`;
        const height = `${iframeRef.current.contentWindow.document.body.scrollHeight}px`;
        if (iframeRef.current.style.width !== width) {
          iframeRef.current.style.width = width;
        }
        if (iframeRef.current.style.height !== height) {
          iframeRef.current.style.height = height;
        }
      }
    };
    const intervalTimer = setInterval(resizeIframe, 250);
    return () => clearInterval(intervalTimer);
  }, [iframeRef]);

  // load the list of API versions from GitHub
  // note that anonymous calls to the GitHub API are rate limited
  useEffect(() => {
    (async () => {
      let data = sessionStorage.getItem('versions');
      if (!data) {
        const response = await fetch('https://api.github.com/repos/twilio/twilio-oai/releases');
        data = (await response.json()).map(version => {
          return {
            name: version.tag_name,
            data: version.published_at
          };
        });
        sessionStorage.setItem('versions', JSON.stringify(data));
      }
      else {
        data = JSON.parse(data);
      }
      setVersions(data);
      setVersion(data[0].name);
    })();
  }, []);

  // load the list of APIs for a given version from GitHub
  // note that anonymous calls to the GitHub API are rate limited
  useEffect(() => {
    (async () => {
      if (!version) {
        return;
      }
      const response = await fetch(`https://api.github.com/repos/twilio/twilio-oai/git/trees/${version}?recursive=1`);
      const data = await response.json();
      setApis(data.tree.filter(file => file.path.startsWith('spec/json/')).map(file => {
        return {
          name: file.path.split('/')[2].split('.')[0].replace('twilio_', '').replace(/_/g, ' '),
          path: file.path,
        };
      }))
    })();
  }, [version]);

  const onVersionSelected = (event) => {
    setVersion(event.target.innerText);
  };

  const onApiSelected = (event) => {
    for (const a of apis) {
      if (a.name === event.target.innerText) {
        setApi(a);
        window.scrollTo(0, 0);
        break;
      }
    }
  };

  return (
    <>
      <Navbar bg="dark" variant="dark" className="navbar">
        <Container fluid className="App">
          <Navbar.Brand href="/">
            <img src="/logo.png" alt="logo" />
            &nbsp;
            Twilio API Explorer
          </Navbar.Brand>
          <Navbar.Collapse className="justify-content-end">
            <Nav className="me-auto">
            </Nav>
            <Nav className="version">
              {version &&
                <>
                  <Navbar.Text>Version:</Navbar.Text>
                  <NavDropdown title={version} id="basic-nav-dropdown">
                    {versions && versions.map(v => (
                      <NavDropdown.Item key={v.name} onClick={onVersionSelected}>{v.name}</NavDropdown.Item>
                    ))}
                  </NavDropdown>
               </>
              }
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
      <Stack direction="horizontal" className="body">
        <div className="apis">
          <ul>
            {apis && apis.map(a => (
              <li key={a.path} className={a.name === api.name ? 'selected' : ''} onClick={onApiSelected}>{a.name}</li>
            ))}
            </ul>
        </div>
        <div className="content">
          {api.path &&
            <iframe tltle={api.name} src={`/api.html?api=https://raw.githubusercontent.com/twilio/twilio-oai/main/${api.path}`} ref={iframeRef} />
          }
        </div>
      </Stack>
    </>
  );
}

export default App;
