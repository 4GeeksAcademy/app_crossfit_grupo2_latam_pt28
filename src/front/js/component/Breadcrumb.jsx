import React from "react";
import { Breadcrumb } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { useLocation } from 'react-router-dom';

const Breadcrumbs = () => {
    const location = useLocation();
    const pathnames = location.pathname.split("/").filter(x => x);

    return (
        <Breadcrumb>
            <LinkContainer to="/" exact>
                <Breadcrumb.Item>Home</Breadcrumb.Item>
            </LinkContainer>
            {pathnames.map((value, index) => {
                const last = index === pathnames.length - 1;
                const to = `/${pathnames.slice(0, index + 1).join("/")}`;

                return last ? (
                    <Breadcrumb.Item active key={to}>{value}</Breadcrumb.Item>
                ) : (
                    <LinkContainer to={to} key={to}>
                        <Breadcrumb.Item>{value}</Breadcrumb.Item>
                    </LinkContainer>
                );
            })}
        </Breadcrumb>
    );
};

export default Breadcrumbs;
