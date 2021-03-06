<?php
/*
 * This file is part of the Sulu CMS.
 *
 * (c) MASSIVE ART WebServices GmbH
 *
 * This source file is subject to the MIT license that is bundled
 * with this source code in the file LICENSE.
 */

namespace Sulu\Component\Webspace\Analyzer;

use Sulu\Component\Webspace\Localization;
use Sulu\Component\Webspace\Portal;
use Sulu\Component\Webspace\Segment;
use Sulu\Component\Webspace\Webspace;
use Symfony\Component\HttpFoundation\Request;

/**
 * Defines the interface for the request analyzer, who is responsible for return the required information for the
 * current request
 * @package Sulu\Component\Webspace\Analyzer
 */
interface RequestAnalyzerInterface
{
    /**
     * Type for a full match
     *
     * A full match is when the URL completely starts with the given URL
     */
    const MATCH_TYPE_FULL = 1;

    /**
     * Type for a partial match
     *
     * A partial match is when only the partial URL matches the given URL
     */
    const MATCH_TYPE_PARTIAL = 2;

    /**
     * Type for a redirect
     *
     * A redirect is when the given URL is just defined to be a redirect
     */
    const MATCH_TYPE_REDIRECT = 3;

    /**
     * Analyzes the current request, and saves the values for portal, language, country and segment for further usage
     * @param Request $request The request to analyze
     * @return
     */
    public function analyze(Request $request);

    /**
     * Returns the current match type for this request
     * @return int
     */
    public function getCurrentMatchType();

    /**
     * Returns the current webspace for this request
     * @return Webspace
     */
    public function getCurrentWebspace();

    /**
     * Returns the current portal for this request
     * @return Portal
     */
    public function getCurrentPortal();

    /**
     * Returns the current segment for this request
     * @return Segment
     */
    public function getCurrentSegment();

    /**
     * Returns the current localization for this Request
     * @return Localization
     */
    public function getCurrentLocalization();

    /**
     * Returns the redirect url
     * @return string
     */
    public function getCurrentRedirect();

    /**
     * Returns the url of the current portal
     * @return string
     */
    public function getCurrentPortalUrl();

    /**
     * Returns the path of the current request, which is the url without host, language and so on
     * @return string
     */
    public function getCurrentResourceLocator();

    /**
     * Returns the prefix required before the resource locator
     * @return string
     */
    public function getCurrentResourceLocatorPrefix();

    /**
     * Returns the post parameters
     * @return array
     */
    public function getCurrentPostParameter();

    /**
     * Returns the get parameters
     * @return array
     */
    public function getCurrentGetParameter();
}
