import React from 'react'
import Particles from "react-tsparticles";
import { loadFull } from "tsparticles";

function Background() {
    const particlesInit = async (main) => {
        // console.log(main);
        await loadFull(main);
      };
      const particlesLoaded = (container) => {
        // console.log(container);
      };

  return (
    <div style={{
        zIndex: "-1",
        position: "absolute"
      }} >
        <Particles
          id="tsparticles"
          init={particlesInit}
          loaded={particlesLoaded}
          options={{
            background: {
                color: "rgb(10,10,25)",
            },
            fpsLimit: 120,
            interactivity: {
                events: {
                    onClick: {
                        enable: true,
                        mode: "push",
                    },
                    onHover: {
                        enable: false,
                        mode: "repulse",
                    },
                    resize: true,
                },
                modes: {
                    push: {
                        quantity: 4,
                    },
                    repulse: {
                        distance: 80,
                        duration: 0.8,
                    },
                },
            },
            particles: {
                shape: {
                    type: "circle",
                },
                links: {
                    color: "#ffffff",
                    distance: 150,
                    enable: false,
                    opacity: 0.5,
                    width: 1,
                },
                move: {
                    direction: "none",
                    enable: true,
                    outModes: {
                        default: "none",
                    },
                    random: false,
                    speed: 0.5,
                    straight: false,
                },
                size: {
                    random: {
                        enable: true,
                        minimumValue: 0.5,
                    },
                    value: 1.4,
                },
                color: {
                    value: "#f1f1f1",
                },
                number: {
                    density: {
                        enable: true,
                        area: 1080,
                    },
                    limit: 0,
                    value: 550,
                },
                opacity: {
                    animation: {
                        enable: true,
                        minimumValue: 0.5,
                        speed: 1.6,
                        sync: false,
                    },
                    random: {
                        enable: true,
                        minimumValue: 0.1,
                    },
                    value: 1,
                },
                interactivity: {
                    detectsOn: "canvas",
                    events: {
                        resize: true,
                    },
                },
            },
        }}
        />
      </div>
  )
}

export default Background