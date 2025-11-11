const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {

    app.use(
        createProxyMiddleware('/qgisSchedule', {
            //target: 'http://localhost/qgis/qgis_mapserv.fcgi.exe', // API endpoint 1 TODO esto cambiará, ya que debería de apuntar al PROXY
            target: 'http://localhost:9090/api/v1/qgisSchedule', // API endpoint 1 TODO esto cambiará, ya que debería de apuntar al PROXY
            changeOrigin: true,
            pathRewrite: {
                "^/qgisSchedule": "/",
            },
            headers: {
                Connection: "keep-alive"
            }
        }),        
        createProxyMiddleware('/qgis', {
            //target: 'http://localhost/qgis/qgis_mapserv.fcgi.exe', // API endpoint 1 TODO esto cambiará, ya que debería de apuntar al PROXY
            target: 'http://localhost:9090/api/v1/qgis', // API endpoint 1 TODO esto cambiará, ya que debería de apuntar al PROXY
            changeOrigin: true,
            pathRewrite: {
                "^/qgis": "/",
            },
            headers: {
                Connection: "keep-alive"
            }
        }),
        createProxyMiddleware('/security/', {
            target: 'http://localhost:9090/api/v1/security', // API endpoint 1 TODO esto cambiará, ya que debería de apuntar al PROXY
            changeOrigin: true,
            pathRewrite: {
                "^/security/": "/",
            },
            headers: {
                Connection: "keep-alive"
            }
        }),
        createProxyMiddleware('/media/', {
            target: 'http://localhost:9090/api/v1/media', // API endpoint 1 TODO esto cambiará, ya que debería de apuntar al PROXY
            changeOrigin: true,
            pathRewrite: {
                "^/media/": "/",
            },
            headers: {
                Connection: "keep-alive"
            }
        }),
        createProxyMiddleware('/user/', {
            target: 'http://localhost:9090/api/v1/user', // API endpoint 1 TODO esto cambiará, ya que debería de apuntar al PROXY
            changeOrigin: true,
            pathRewrite: {
                "^/user/": "/",
            },
            headers: {
                Connection: "keep-alive"
            }
        }),
        createProxyMiddleware('/unit/', {
            target: 'http://localhost:9090/api/v1/unit', // API endpoint 1 TODO esto cambiará, ya que debería de apuntar al PROXY
            changeOrigin: true,
            pathRewrite: {
                "^/unit/": "/",
            },
            headers: {
                Connection: "keep-alive"
            }
        }),
        createProxyMiddleware('/unit_user/', {
            target: 'http://localhost:9090/api/v1/unit_user', // API endpoint 1 TODO esto cambiará, ya que debería de apuntar al PROXY
            changeOrigin: true,
            pathRewrite: {
                "^/unit_user/": "/",
            },
            headers: {
                Connection: "keep-alive"
            }
        }),
        createProxyMiddleware('/security/', {
            target: 'http://localhost:9090/api/v1/security', // API endpoint 1 TODO esto cambiará, ya que debería de apuntar al PROXY
            changeOrigin: true,
            pathRewrite: {
                "^/security/": "/",
            },
            headers: {
                Connection: "keep-alive"
            }
        }),
        createProxyMiddleware('/roles/', {
            target: 'http://localhost:9090/api/v1/roles', // API endpoint 1 TODO esto cambiará, ya que debería de apuntar al PROXY
            changeOrigin: true,
            pathRewrite: {
                "^/roles/": "/",
            },
            headers: {
                Connection: "keep-alive"
            }
        }),
        createProxyMiddleware('/permissions/', {
            target: 'http://localhost:9090/api/v1/permissions', // API endpoint 1 TODO esto cambiará, ya que debería de apuntar al PROXY
            changeOrigin: true,
            pathRewrite: {
                "^/permissions/": "/",
            },
            headers: {
                Connection: "keep-alive"
            }
        }),
        createProxyMiddleware('/media_group/', {
            target: 'http://localhost:9090/api/v1/media_group', // API endpoint 1 TODO esto cambiará, ya que debería de apuntar al PROXY
            changeOrigin: true,
            pathRewrite: {
                "^/media_group/": "/",
            },
            headers: {
                Connection: "keep-alive"
            }
        }),
        createProxyMiddleware('/app/', {
            target: 'http://localhost:9090/api/v1/app', // API endpoint 1 TODO esto cambiará, ya que debería de apuntar al PROXY
            changeOrigin: true,
            pathRewrite: {
                "^/app/": "/",
            },
            headers: {
                Connection: "keep-alive"
            }
        }),
        createProxyMiddleware('/projects/', {
            target: 'http://localhost:9090/api/v1/projects', // API endpoint 1 TODO esto cambiará, ya que debería de apuntar al PROXY
            changeOrigin: true,
            pathRewrite: {
                "^/projects/": "/",
            },
            headers: {
                Connection: "keep-alive"
            }
        }),
        createProxyMiddleware('/params/', {
            target: 'http://localhost:9090/api/v1/params', // API endpoint 1 TODO esto cambiará, ya que debería de apuntar al PROXY
            changeOrigin: true,
            pathRewrite: {
                "^/params/": "/",
            },
            headers: {
                Connection: "keep-alive"
            }
        }),
        createProxyMiddleware('/incidencias/', {
            target: 'http://localhost:9090/api/v1/incidencias', // API endpoint 1 TODO esto cambiará, ya que debería de apuntar al PROXY
            changeOrigin: true,
            pathRewrite: {
                "^/incidencias/": "/",
            },
            headers: {
                Connection: "keep-alive"
            }
        }),
        createProxyMiddleware('/external_reports/', {
            target: 'http://localhost:5101/', // API endpoint 1 TODO esto cambiará, ya que debería de apuntar al PROXY
            changeOrigin: true,
            pathRewrite: {
                "^/external_reports/": "/",
            },
            headers: {
                Connection: "keep-alive"
            }
        })
    );

}